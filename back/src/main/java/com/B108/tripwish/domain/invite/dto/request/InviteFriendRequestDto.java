package com.B108.tripwish.domain.invite.dto.request;

import lombok.Getter;

import java.util.List;

@Getter
public class InviteFriendRequestDto {
    private Long roomId;
    private List<Long> friendIds;
}
