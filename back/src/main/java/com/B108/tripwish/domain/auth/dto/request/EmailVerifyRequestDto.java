package com.B108.tripwish.domain.auth.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmailVerifyRequestDto {
  private String email;
  private String code;
}
