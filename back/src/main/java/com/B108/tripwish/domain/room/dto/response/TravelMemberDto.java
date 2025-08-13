package com.B108.tripwish.domain.room.dto.response;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TravelMemberDto {
  private Long userId;
  private String profileImg;
  private String nickname;
  private String email;
  private boolean isOwner;
  private boolean isFriend;
}
