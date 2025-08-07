package com.B108.tripwish.domain.auth.security;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.security.core.Authentication;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import com.B108.tripwish.domain.auth.dto.TokenType;
import com.B108.tripwish.domain.auth.service.CustomUserDetails;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

  private final JwtTokenProvider jwtTokenProvider;

  public JwtHandshakeInterceptor(JwtTokenProvider jwtTokenProvider) {
    this.jwtTokenProvider = jwtTokenProvider;
  }

  @Override
  public boolean beforeHandshake(
      ServerHttpRequest request,
      ServerHttpResponse response,
      WebSocketHandler wsHandler,
      Map<String, Object> attributes)
      throws Exception {

    if (request instanceof ServletServerHttpRequest servletRequest) {
      HttpServletRequest httpServletRequest = servletRequest.getServletRequest();
      Cookie[] cookies = httpServletRequest.getCookies();

      log.info("🔑 WebSocket Handshake 시작");

      if (cookies == null) {
        log.warn("❌ 쿠키 없음");
      } else {
        for (Cookie cookie : cookies) {
          log.info("🍪 쿠키 확인 - {}={}", cookie.getName(), cookie.getValue());

          if ("access_token".equals(cookie.getName())) {
            String token = cookie.getValue();
            log.info("📦 JWT 추출: {}", token);

            if (!jwtTokenProvider.validateToken(token, TokenType.ACCESS)) {
              log.warn("❌ JWT 토큰 유효하지 않음");
            } else {
              log.info("✅ JWT 토큰 유효");
              Authentication authentication = jwtTokenProvider.getAuthentication(token);
              if (authentication == null) {
                log.warn("❌ [Handshake] 인증 객체 생성 실패");
                break;
              }

              CustomUserDetails user = (CustomUserDetails) authentication.getPrincipal();
              log.info("👤 [Handshake] 인증된 사용자: {}", user.getUsername());

              attributes.put("user", user);
              return true;
            }
          }
        }
      }

      log.warn("❌ WebSocket Handshake 실패: 400");
      response.setStatusCode(HttpStatus.BAD_REQUEST);
      return false;
    }

    log.warn("❌ WebSocket Handshake 실패 (ServletRequest 아님)");
    return false;
  }

  @Override
  public void afterHandshake(
      ServerHttpRequest request,
      ServerHttpResponse response,
      WebSocketHandler wsHandler,
      Exception exception) {
    // 필요 시 로깅 추가
    log.info("🤝 WebSocket Handshake 완료");
  }
}
