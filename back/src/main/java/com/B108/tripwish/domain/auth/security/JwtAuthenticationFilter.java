package com.B108.tripwish.domain.auth.security;

import java.io.IOException;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.GenericFilterBean;

import com.B108.tripwish.domain.auth.dto.TokenType;
import com.B108.tripwish.global.exception.CustomException;
import com.B108.tripwish.global.exception.ErrorCode;
import com.B108.tripwish.global.exception.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends GenericFilterBean {

  private final JwtTokenProvider jwtTokenProvider;

  @Override
  public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
      throws IOException, ServletException {
    HttpServletRequest httpRequest = (HttpServletRequest) request;
    HttpServletResponse httpResponse = (HttpServletResponse) response;

    try {
      String path = httpRequest.getRequestURI();
      if (path.equals("/auth/reissue")
          || path.equals("/auth/login")
          || path.equals("/auth/signup")) {
        log.info("[JWT Filter] 인증 예외 경로이므로 필터 건너뜀"); // 추가
        chain.doFilter(request, response);
        return;
      }

      // 2. Request Header 에서 JWT 토큰 추출
      String token = resolveToken(httpRequest);
      log.info("[JWT Filter] 추출한 토큰: {}", token); // 추가

      // 3. validateToken으로 토큰 유효성 검사
      if (token != null && jwtTokenProvider.validateToken(token, TokenType.ACCESS)) {
        log.info("[JWT Filter] 토큰 유효성 검사 통과"); // 추가
        Authentication authentication = jwtTokenProvider.getAuthentication(token);
        SecurityContextHolder.getContext().setAuthentication(authentication);
        log.info("권한 확인: {}", authentication.getAuthorities());
      } else {
        log.warn("[JWT Filter] 토큰이 없거나 유효하지 않음"); // 추가
      }

      chain.doFilter(request, response);

    } catch (CustomException ex) {
      // ✅ 예외를 잡고 401 상태와 JSON 응답 전송
      ErrorCode errorCode = ex.getErrorCode();
      httpResponse.setStatus(errorCode.getStatus().value());
      httpResponse.setContentType("application/json;charset=UTF-8");

      ErrorResponse errorResponse =
          new ErrorResponse(
              errorCode.getCode(), errorCode.getMessage(), errorCode.getStatus().value());

      ObjectMapper objectMapper = new ObjectMapper();
      httpResponse.getWriter().write(objectMapper.writeValueAsString(errorResponse));
      return; // ❗반드시 필요: 응답 후 필터 체인 종료
    }
  }

  // Request Header에서 토큰 정보 추출
  private String resolveToken(HttpServletRequest request) {
    String bearerToken = request.getHeader("Authorization");
    log.info("📦 Authorization 헤더 내용: {}", bearerToken);
    if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
      return bearerToken.substring(7);
    }
    return null;
  }
}
