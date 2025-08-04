package com.B108.tripwish.domain.invite.controller;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.invite.dto.request.InviteFriendRequestDto;
import com.B108.tripwish.domain.invite.dto.response.InvitableFriendListResponseDto;
import com.B108.tripwish.domain.invite.dto.response.InviteLinkResponseDto;
import com.B108.tripwish.domain.invite.dto.response.JoinRoomResponseDto;
import com.B108.tripwish.domain.invite.service.InviteService;
import com.B108.tripwish.global.dto.CommonResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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

    @Operation(
            summary = "초대 가능한 친구 목록 조회",
            description = "여행방 안에서 초대 가능한 친구 목록을 조회합니다. 각 친구의 닉네임, 이메일, 방 참여 여부(alreadyInvited)를 포함하여 반환합니다.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "친구 목록 조회 성공"),
                    @ApiResponse(responseCode = "401", description = "인증 실패 (AccessToken 누락 / 유효하지 않음 / 만료됨)"),
                    @ApiResponse(responseCode = "404", description = "여행방 정보를 찾을 수 없습니다."),
                    @ApiResponse(responseCode = "500", description = "서버 내부 오류")
            }
    )
    @GetMapping("/friends/{roomId}")
    public ResponseEntity<InvitableFriendListResponseDto> getFriendList(@AuthenticationPrincipal CustomUserDetails user,
                                                                        @PathVariable Long roomId){
        InvitableFriendListResponseDto response = inviteService.getFriends(user, roomId);
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "여행방 친구 초대",
            description = "선택한 친구들을 여행방에 초대합니다. 이미 참여 중인 친구는 제외됩니다.",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    description = "초대할 친구들의 ID 리스트와 여행방 ID",
                    content = @Content(schema = @Schema(implementation = InviteFriendRequestDto.class))
            ),
            responses = {
                    @ApiResponse(responseCode = "200", description = "친구 초대 성공"),
                    @ApiResponse(responseCode = "401", description = "인증 실패 (AccessToken 누락 / 유효하지 않음 / 만료됨)"),
                    @ApiResponse(responseCode = "404", description = "해당 여행방 또는 사용자 정보를 찾을 수 없습니다."),
                    @ApiResponse(responseCode = "500", description = "서버 내부 오류")
            }
    )
    @PostMapping("/invite/friends")
    public ResponseEntity<CommonResponse> inviteFriends(@AuthenticationPrincipal CustomUserDetails user,
                                                        @RequestBody InviteFriendRequestDto request) {
        inviteService.inviteFriends(request);
        return ResponseEntity.ok(new CommonResponse("INVITE_SUCCESS", "친구 초대가 완료되었습니다."));
    }

}

