package com.B108.tripwish.domain.auth.service;

import java.time.Duration;
import java.time.LocalDateTime;

import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.B108.tripwish.domain.auth.dto.JwtToken;
import com.B108.tripwish.domain.auth.dto.TokenType;
import com.B108.tripwish.domain.auth.security.JwtTokenProvider;
import com.B108.tripwish.domain.user.entity.User;
import com.B108.tripwish.domain.user.entity.UserToken;
import com.B108.tripwish.domain.user.repository.UserRepository;
import com.B108.tripwish.domain.user.repository.UserTokenRepository;
import com.B108.tripwish.global.exception.CustomException;
import com.B108.tripwish.global.exception.ErrorCode;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

  private final UserRepository userRepository;
  private final AuthenticationManagerBuilder authenticationManagerBuilder;
  private final JwtTokenProvider jwtTokenProvider;
  private final UserTokenRepository userTokenRepository;
  private final PasswordEncoder passwordEncoder;

  @Override
  @Transactional
  public JwtToken login(String email, String password, HttpServletResponse response) {
    // 1. email + password 를 기반으로 Authentication 객체 생성
    // 이때 authentication 은 인증 여부를 확인하는 authenticated 값이 false
    UsernamePasswordAuthenticationToken authenticationToken =
        new UsernamePasswordAuthenticationToken(email, password);

    // 2. 실제 검증 전에 유저를 수동 조회해서 비밀번호 비교 로그 출력
    User user =
        userRepository
            .findByEmail(email)
            .orElseThrow(
                () -> {
                  log.warn("사용자 DB 조회 실패 - 이메일: {}", email);
                  return new CustomException(ErrorCode.USER_NOT_FOUND);
                });

    // 2-1. 실제 검증. authenticate() 메서드를 통해 요청된 User에 대한 검증 진행
    // authenticate 메서드가 실행될 때 CustomUserDetailsService에서 만든 loadUserByUsername 메서드
    // 실행
    Authentication authentication;
    try {
      authentication = authenticationManagerBuilder.getObject().authenticate(authenticationToken);
    } catch (AuthenticationException e) {
      // log.warn("[로그인 실패] 인증 실패 - 이메일: {}", email);
      throw new CustomException(ErrorCode.LOGIN_FAILED);
    }
    // 3. 인증 정보를 기반으로 JWT 토큰 생성
    JwtToken jwtToken = jwtTokenProvider.generateToken(authentication, null);

    // 5. 쿠키로 access_token 설정
    ResponseCookie accessTokenCookie = ResponseCookie.from("access_token", jwtToken.getAccessToken())
            .httpOnly(true)
            .secure(true) // ⚠️ 로컬 개발 중이면 false, 배포 시 true
            .sameSite("None") // Cross-Origin 허용
            .path("/")
            .maxAge(Duration.ofHours(1))
            .build();

    // 6. 쿠키로 refresh_token 설정
    ResponseCookie refreshTokenCookie = ResponseCookie.from("refresh_token", jwtToken.getRefreshToken())
            .httpOnly(true)
            .secure(true) // ⚠️ 로컬 개발 중이면 false, 배포 시 true
            .sameSite("None")
            .path("/")
            .maxAge(Duration.ofDays(7))
            .build();

    // 7. 응답에 Set-Cookie 헤더 추가
    response.addHeader("Set-Cookie", accessTokenCookie.toString());
    response.addHeader("Set-Cookie", refreshTokenCookie.toString());


    userTokenRepository.deleteByUserId(user.getId());
    userTokenRepository.save(
        UserToken.builder()
            .user(user)
            .refreshToken(jwtToken.getRefreshToken())
            .issuedAt(LocalDateTime.now())
            .expiresAt(jwtToken.getRefreshTokenExpiresAt())
            .build());

    return jwtToken;
  }

  @Transactional
  @Override
  public void logout(String accessToken) {
    Authentication authentication = jwtTokenProvider.getAuthentication(accessToken);
    String email = authentication.getName();
    User user =
        userRepository
            .findByEmail(email)
            .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    try {
      userTokenRepository.deleteByUserId(user.getId());
    } catch (Exception e) {
      log.error("[로그아웃 실패]", e);
      throw new CustomException(ErrorCode.LOGOUT_FAILED);
    }
  }

  @Override
  public JwtToken reissue(String refreshToken, HttpServletResponse response) {
    if (!jwtTokenProvider.validateToken(refreshToken, TokenType.REFRESH)) {
      throw new CustomException(ErrorCode.INVALID_REFRESH_TOKEN);
    }

    UserToken token =
            userTokenRepository
                    .findByRefreshToken(refreshToken)
                    .orElseThrow(() -> new CustomException(ErrorCode.INVALID_REFRESH_TOKEN_REQUEST));

    User user = token.getUser();
    CustomUserDetails userDetails = new CustomUserDetails(user);
    Authentication authentication =
            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

    JwtToken newToken = jwtTokenProvider.generateToken(authentication, refreshToken);

    // RefreshToken 갱신 시 DB 업데이트
    if (!refreshToken.equals(newToken.getRefreshToken())) {
      token.setRefreshToken(newToken.getRefreshToken());
      token.setExpiresAt(newToken.getRefreshTokenExpiresAt());
      token.setIssuedAt(LocalDateTime.now());
      userTokenRepository.save(token);
    }

    // 👉 새 토큰을 쿠키로 응답에 담기
    ResponseCookie accessTokenCookie = ResponseCookie.from("access_token", newToken.getAccessToken())
            .httpOnly(true)
            .secure(false) // HTTPS 환경이면 true
            .sameSite("None")
            .path("/")
            .maxAge(Duration.ofHours(1))
            .build();

    ResponseCookie refreshTokenCookie = ResponseCookie.from("refresh_token", newToken.getRefreshToken())
            .httpOnly(true)
            .secure(false)
            .sameSite("None")
            .path("/")
            .maxAge(Duration.ofDays(7))
            .build();

    response.addHeader("Set-Cookie", accessTokenCookie.toString());
    response.addHeader("Set-Cookie", refreshTokenCookie.toString());

    return newToken;
  }
}
