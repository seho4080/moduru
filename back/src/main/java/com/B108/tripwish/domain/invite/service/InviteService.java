package com.B108.tripwish.domain.invite.service;

import com.B108.tripwish.domain.invite.dto.response.InviteLinkResponseDto;

public interface InviteService {
    InviteLinkResponseDto createInviteLink(Long roomId);
}
