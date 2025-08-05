package com.B108.tripwish.domain.invite.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class InvitableFriendListResponseDto {
    List<FriendInviteInfoResponseDto> friendLists;
}
