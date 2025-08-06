package com.B108.tripwish.domain.auth.security;

import java.security.Key;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.stream.Collectors;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import com.B108.tripwish.domain.auth.dto.JwtToken;
import com.B108.tripwish.domain.auth.dto.TokenType;
import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.user.entity.User;
import com.B108.tripwish.domain.user.repository.UserRepository;
import com.B108.tripwish.global.exception.CustomException;
import com.B108.tripwish.global.exception.ErrorCode;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;

@Slf4j
@Component
public class JwtTokenProvider {
  private final Key key;
  private final UserRepository userRepository;

  @Value("${jwt.access-token-validity}")
  private long accessTokenValidityInseconds;

  @Value("${jwt.refresh-token-validity}")
  private long refreshTokenValidityInSeconds;

  @Autowired
  public JwtTokenProvider(@Value("${jwt.secret}") String secretKey, UserRepository userRepository) {
    byte[] keyBytes = Decoders.BASE64.decode(secretKey);
    this.key = Keys.hmacShaKeyFor(keyBytes);
    this.userRepository = userRepository;
  }

  public JwtToken generateToken(Authentication authentication, String existingRefreshToken) {
    // 권한 가져오기
    String authorities =
        authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.joining(","));

    long now = (new Date()).getTime();

    // AccessToken 생성
    Date accessTokenExpiresln = new Date(now + 60 * 60 * 1000);
    String accessToken =
        Jwts.builder()
            .setSubject(authentication.getName())
            .claim("auth", authorities)
            .claim("type", TokenType.ACCESS.name())
            .setExpiration(accessTokenExpiresln)
            .signWith(key, SignatureAlgorithm.HS256)
            .compact();

    // RefreshToken 생성
    String refreshToken = null;
    LocalDateTime refreshTokenExpiresln = null;
    boolean shouldIssueNewRefreshToken = true;

    if (existingRefreshToken != null) {
      try {
        Claims claims = parseClaims(existingRefreshToken);
        Date exp = claims.getExpiration();
        LocalDateTime expiresAt = exp.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();

        if (expiresAt.isAfter(LocalDateTime.now().plusDays(3))) {
          shouldIssueNewRefreshToken = false;
          refreshToken = existingRefreshToken;
          refreshTokenExpiresln = expiresAt;
        }
      } catch (ExpiredJwtException e) {
        shouldIssueNewRefreshToken = true;
      } catch (Exception e) {
        shouldIssueNewRefreshToken = true;
      }
    }
    if (shouldIssueNewRefreshToken) {
      refreshTokenExpiresln = LocalDateTime.now().plusDays(7);
      Date refreshTokenExpDate =
          Date.from(refreshTokenExpiresln.atZone(ZoneId.systemDefault()).toInstant());
      refreshToken =
          Jwts.builder()
              .claim("type", TokenType.REFRESH.name())
              .setExpiration(refreshTokenExpDate)
              .signWith(key, SignatureAlgorithm.HS256)
              .compact();
    }

    return JwtToken.builder()
        .grantType("Bearer")
        .accessToken(accessToken)
        .refreshToken(refreshToken)
        .refreshTokenExpiresAt(refreshTokenExpiresln)
        .build();
  }

  // Jwt 토큰을 복호화하여 토큰에 들어있는 정보를 꺼내는 메서드
  public Authentication getAuthentication(String accessToken) {
    try {
      // Jwt 토큰 복호화
      Claims claims = parseClaims(accessToken);

      if (claims.get("auth") == null) {
        throw new RuntimeException("권한 정보가 없는 토큰입니다.");
      }

      // 클레임에서 권한 정보 가져오기
      Collection<? extends GrantedAuthority> authorities =
          Arrays.stream(claims.get("auth").toString().split(","))
              .map(SimpleGrantedAuthority::new)
              .collect(Collectors.toList());
      /**
       * // UserDetails 객체를 만들어서 Authentication return // UserDetails: interface, User: UserDetails를
       * 구현한 class UserDetails principal = new User(claims.getSubject(), "", authorities); return
       * new UsernamePasswordAuthenticationToken(principal, "", authorities);
       */
      String email = claims.getSubject();
      User user =
          userRepository
              .findByEmail(email)
              .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

      CustomUserDetails customUserDetails = new CustomUserDetails(user);

      return new UsernamePasswordAuthenticationToken(
          customUserDetails, "", customUserDetails.getAuthorities());

    } catch (ExpiredJwtException e) {
      throw new CustomException(ErrorCode.EXPIRED_ACCESS_TOKEN);
    } catch (JwtException | IllegalArgumentException e) {
      throw new CustomException(ErrorCode.INVALID_ACCESS_TOKEN);
    }
  }

  // 토큰 정보를 검증하는 메서드
  public boolean validateToken(String token, TokenType type) {
    try {
      log.debug("🔍 [validateToken] 토큰 유효성 검사 시작 - 타입: {}, 토큰: {}", type.name(), token);

      Claims claims = Jwts.parserBuilder()
              .setSigningKey(key)
              .build()
              .parseClaimsJws(token)
              .getBody();

      String tokenTypeClaim = claims.get("type", String.class);
      log.debug("🔎 [validateToken] 추출된 token type claim: {}", tokenTypeClaim);

      if (!type.name().equals(tokenTypeClaim)) {
        log.warn("❌ [validateToken] 토큰 타입 불일치 - 기대한 타입: {}, 실제 타입: {}", type.name(), tokenTypeClaim);
        throw new CustomException(
                type == TokenType.ACCESS
                        ? ErrorCode.INVALID_ACCESS_TOKEN
                        : ErrorCode.INVALID_REFRESH_TOKEN
        );
      }

      log.info("✅ [validateToken] 토큰 유효성 통과 - subject: {}", claims.getSubject());
      return true;

    } catch (ExpiredJwtException e) {
      log.warn("⏰ [validateToken] 토큰 만료됨", e);
      throw new CustomException(
              type == TokenType.ACCESS
                      ? ErrorCode.EXPIRED_ACCESS_TOKEN
                      : ErrorCode.EXPIRED_REFRESH_TOKEN
      );

    } catch (SignatureException e) {
      log.warn("🔐 [validateToken] 서명 검증 실패", e);
      throw new CustomException(
              type == TokenType.ACCESS
                      ? ErrorCode.INVALID_ACCESS_SIGNATURE
                      : ErrorCode.INVALID_REFRESH_SIGNATURE
      );

    } catch (JwtException e) {
      log.warn("⚠️ [validateToken] 기타 JWT 파싱 오류", e);
      throw new CustomException(
              type == TokenType.ACCESS
                      ? ErrorCode.INVALID_ACCESS_TOKEN
                      : ErrorCode.INVALID_REFRESH_TOKEN
      );
    }
  }

  // accessToken
  private Claims parseClaims(String accessToken) {

    return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(accessToken).getBody();
  }
}
