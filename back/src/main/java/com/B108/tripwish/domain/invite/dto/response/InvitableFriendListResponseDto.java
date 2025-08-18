package com.B108.tripwish.domain.invite.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class InvitableFriendListResponseDto {
  List<FriendInviteInfoResponseDto> friendLists;
}
