package com.B108.tripwish.domain.invite.controller;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.invite.dto.response.InviteLinkResponseDto;
import com.B108.tripwish.domain.invite.dto.response.JoinRoomResponseDto;
import com.B108.tripwish.domain.invite.service.InviteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
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


    @Operation(
            summary = "여행방 초대 링크 생성",
            description = "해당 roomId에 대한 초대 링크를 생성합니다. 초대 링크는 24시간 동안 유효하며, 이미 유효한 링크가 있는 경우 기존 링크를 반환합니다.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "초대 링크 생성 성공"),
                    @ApiResponse(responseCode = "400", description = "요청 파라미터 오류 또는 이미 초대 링크가 존재합니다.", content = @Content),
                    @ApiResponse(responseCode = "401", description = "인증 실패 (AccessToken 누락 / 유효하지 않음 / 만료됨)", content = @Content),
                    @ApiResponse(responseCode = "404", description = "해당 roomId에 해당하는 여행방을 찾을 수 없습니다.", content = @Content),
                    @ApiResponse(responseCode = "500", description = "서버 내부 오류", content = @Content)
            }
    )
    @PostMapping("/link")
    public ResponseEntity<InviteLinkResponseDto> createInviteLink(@AuthenticationPrincipal CustomUserDetails user,
                                                                  @RequestParam Long roomId) {
        InviteLinkResponseDto response = inviteService.createInviteLink(roomId);
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "초대 토큰을 통한 여행방 참여",
            description = "유효한 초대 토큰을 이용하여 여행방에 참여합니다. 이미 방의 멤버인 경우 재등록 없이 방 ID를 반환하며, 유효하지 않거나 만료된 토큰은 오류를 반환합니다.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "여행방 참여 성공 및 roomId 반환"),
                    @ApiResponse(responseCode = "400", description = "초대 토큰이 유효하지 않거나 만료됨", content = @Content),
                    @ApiResponse(responseCode = "401", description = "인증 실패 (AccessToken 누락 / 유효하지 않음 / 만료됨)", content = @Content),
                    @ApiResponse(responseCode = "500", description = "서버 내부 오류", content = @Content)
            }
    )
    @PostMapping("/join")
    public ResponseEntity<JoinRoomResponseDto> joinRoom(@AuthenticationPrincipal CustomUserDetails user,
                                                        @RequestParam String token) {

        JoinRoomResponseDto response = inviteService.joinRoomWithToken(user, token);
        return ResponseEntity.ok(response);
    }

}

