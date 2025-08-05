package com.B108.tripwish.domain.auth.service;

import java.time.LocalDateTime;
import java.util.List;

import com.B108.tripwish.global.util.CookieUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
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

    // AccessToken
    Cookie accessTokenCookie = new Cookie("access_token", jwtToken.getAccessToken());
    accessTokenCookie.setHttpOnly(true);
    accessTokenCookie.setSecure(true);
    accessTokenCookie.setPath("/");
    accessTokenCookie.setMaxAge(60 * 60); // 1시간

    // RefreshToken
    Cookie refreshTokenCookie = new Cookie("refresh_token", jwtToken.getRefreshToken());
    refreshTokenCookie.setHttpOnly(true);
    refreshTokenCookie.setSecure(true);
    refreshTokenCookie.setPath("/");
    refreshTokenCookie.setMaxAge(7 * 24 * 60 * 60); // 7일

    response.addCookie(accessTokenCookie);
    response.addCookie(refreshTokenCookie);


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
  public JwtToken reissue(String refreshToken) {
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

    if (!refreshToken.equals(newToken.getRefreshToken())) {
      token.setRefreshToken(newToken.getRefreshToken());
      token.setExpiresAt(newToken.getRefreshTokenExpiresAt());
      token.setIssuedAt(LocalDateTime.now());
      userTokenRepository.save(token);
    }

    return newToken;
  }
}
