package com.B108.tripwish.domain.invite.dto.response;


import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class FriendInviteInfoResponseDto {
    private Long userId;
    private String nickName;
    private String email;
    private boolean alreadyInvited;
}
