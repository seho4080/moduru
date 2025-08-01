package com.B108.tripwish.domain.user.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequestDto {
  private String nickname;
  private String password;
  private String phone;
  private String profileImg;
}
