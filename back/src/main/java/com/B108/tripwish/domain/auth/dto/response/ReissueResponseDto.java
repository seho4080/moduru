package com.B108.tripwish.domain.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ReissueResponseDto {
  private String accessToken;
  private String refreshToken;
}
