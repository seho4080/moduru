package com.B108.tripwish.domain.user.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class FriendResponseDto {
  private Long friendId;
  private String nickname;
  private String profileImg;
  private String email;
}
