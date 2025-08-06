package com.B108.tripwish.domain.invite.dto.request;

import java.util.List;

import lombok.Getter;

@Getter
public class InviteFriendRequestDto {
  private Long roomId;
  private List<Long> friendIds;
}
