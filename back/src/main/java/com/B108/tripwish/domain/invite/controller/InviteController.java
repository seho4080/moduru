package com.B108.tripwish.domain.invite.controller;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.invite.dto.response.InviteLinkResponseDto;
import com.B108.tripwish.domain.invite.service.InviteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/invites")
public class InviteController {

    private final InviteService inviteService;

    @PostMapping("/link")
    public ResponseEntity<InviteLinkResponseDto> createInviteLink(@AuthenticationPrincipal CustomUserDetails user,
                                                                  @RequestParam Long roomId) {
        InviteLinkResponseDto response = inviteService.createInviteLink(roomId);
        return ResponseEntity.ok(response);
    }

}

