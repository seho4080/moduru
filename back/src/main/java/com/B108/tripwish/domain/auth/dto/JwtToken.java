package com.B108.tripwish.domain.auth.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
@AllArgsConstructor
public class JwtToken {

  private String grantType;
  private String accessToken;
  private String refreshToken;
  private LocalDateTime refreshTokenExpiresAt;
}
