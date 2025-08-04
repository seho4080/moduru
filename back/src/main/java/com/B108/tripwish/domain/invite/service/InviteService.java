package com.B108.tripwish.domain.invite.service;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.invite.dto.request.InviteFriendRequestDto;
import com.B108.tripwish.domain.invite.dto.response.InvitableFriendListResponseDto;
import com.B108.tripwish.domain.invite.dto.response.InviteLinkResponseDto;
import com.B108.tripwish.domain.invite.dto.response.JoinRoomResponseDto;

public interface InviteService {
    InviteLinkResponseDto createInviteLink(Long roomId);

    JoinRoomResponseDto joinRoomWithToken(CustomUserDetails user, String token);

    InvitableFriendListResponseDto getFriends(CustomUserDetails user, Long roomId);

    void inviteFriends(InviteFriendRequestDto request);


}
