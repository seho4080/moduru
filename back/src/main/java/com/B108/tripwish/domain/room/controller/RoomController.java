package com.B108.tripwish.domain.room.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.room.dto.request.CustomPlaceCreateRequestDto;
import com.B108.tripwish.domain.room.dto.request.UpdateTravelRoomRequestDto;
import com.B108.tripwish.domain.room.dto.response.*;
import com.B108.tripwish.domain.room.service.RoomService;
import com.B108.tripwish.domain.room.service.WantPlaceReaderService;
import com.B108.tripwish.domain.room.service.WantPlaceService;
import com.B108.tripwish.global.common.dto.CommonResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/rooms")
public class RoomController {

  private final RoomService roomService;
  private final WantPlaceService wantPlaceService;
  private final WantPlaceReaderService wantPlaceReaderService;

  @Operation(
      summary = "여행 방 생성",
      description = "여행 시작하기를 누르면 여행 방이 db에 생성됩니다.",
      responses = {
        @ApiResponse(responseCode = "200", description = "여행 방 생성 성공"),
        @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자", content = @Content),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류", content = @Content)
      })
  @PostMapping
  public ResponseEntity<TravelRoomCreateResponseDto> createRoom(
      @AuthenticationPrincipal CustomUserDetails user) {
    TravelRoomCreateResponseDto response = roomService.addRoom(user);
    return ResponseEntity.ok(response);
  }

  @Operation(
      summary = "여행 방 접속",
      description = "여행방 ID를 이용해 해당 여행방의 정보를 조회합니다. 사용자는 방 ID를 통해 기존에 생성된 여행방에 접속할 수 있습니다.",
      responses = {
        @ApiResponse(responseCode = "200", description = "여행 방 정보 조회 성공"),
        @ApiResponse(
            responseCode = "404",
            description = "해당 roomId에 해당하는 여행 방을 찾을 수 없습니다.",
            content = @Content),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류", content = @Content)
      })
  @GetMapping("/{roomId}")
  public ResponseEntity<TravelRoomResponseDto> getTravelRoom(
      @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long roomId) {
    TravelRoomResponseDto response = roomService.enterRoom(user, roomId);
    return ResponseEntity.ok(response);
  }

  @Operation(
      summary = "여행 방 수정",
      description = "여행 방의 지역 또는 여행 기간 또는 방 이름이 수정됩니다. 방 ID에 해당하는 방의 해당 정보가 수정됩니다.",
      responses = {
        @ApiResponse(responseCode = "200", description = "여행 방 수정 성공"),
        @ApiResponse(
            responseCode = "404",
            description = "해당 roomId에 해당하는 여행 방을 찾을 수 없습니다.",
            content = @Content),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류", content = @Content)
      })
  @PatchMapping("/{roomId}/update")
  public ResponseEntity<TravelRoomResponseDto> updateTravelRoom(
      @PathVariable Long roomId, @RequestBody UpdateTravelRoomRequestDto request) {
    TravelRoomResponseDto response = roomService.updateRoom(roomId, request);
    return ResponseEntity.ok(response);
  }

  @Operation(
      summary = "여행방 탈퇴",
      description = "로그인한 사용자가 해당 여행방에서 탈퇴합니다. 여행 멤버 DB 에서 해당 사용자가 삭제됩니다.",
      responses = {
        @ApiResponse(responseCode = "200", description = "탈퇴 성공"),
        @ApiResponse(
            responseCode = "404",
            description = "해당 roomId 또는 사용자 정보를 찾을 수 없습니다.",
            content = @Content),
        @ApiResponse(responseCode = "500", description = "서버 오류", content = @Content)
      })
  @DeleteMapping("/{roomId}/leave")
  public ResponseEntity<CommonResponse> leaveTravelRoom(
      @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long roomId) {

    roomService.leaveRoom(user, roomId);
    return ResponseEntity.ok(new CommonResponse("ROOM_LEAVE_SUCCESS", "여행방에서 성공적으로 탈퇴했습니다."));
  }

  @Operation(
      summary = "여행방 삭제",
      description = "여행방을 삭제합니다. 방장만 삭제할 수 있으며, 삭제 시 해당 여행방의 모든 정보가 함께 삭제됩니다.",
      responses = {
        @ApiResponse(responseCode = "200", description = "여행방 삭제 성공"),
        @ApiResponse(responseCode = "401", description = "인증 실패 (AccessToken 누락 / 유효하지 않음 / 만료됨)"),
        @ApiResponse(
            responseCode = "403",
            description = "방장이 아닌 사용자는 삭제할 수 없습니다.",
            content = @Content),
        @ApiResponse(
            responseCode = "404",
            description = "해당 roomId 또는 사용자 정보를 찾을 수 없습니다.",
            content = @Content),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류", content = @Content)
      })
  @DeleteMapping("/{roomId}")
  public ResponseEntity<CommonResponse> deleteTravelRoom(
      @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long roomId) {
    roomService.deleteRoom(user, roomId);
    return ResponseEntity.ok(new CommonResponse("ROOM_DELETE_SUCCESS", "여행방이 성공적으로 삭제되었습니다."));
  }

  @Operation(
      summary = "희망 장소 목록 조회",
      description = "희망 장소 목록을 조회합니다.",
      responses = {
        @ApiResponse(responseCode = "200", description = "희망 장소 목록 조회 성공"),
        @ApiResponse(
            responseCode = "404",
            description = "해당 roomId 또는 장소 정보를 찾을 수 없습니다.",
            content = @Content),
        @ApiResponse(responseCode = "500", description = "서버 오류", content = @Content)
      })
  @GetMapping("/{roomId}/wants")
  public ResponseEntity<PlaceWantListResponseDto> getPlaceWants(
      @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long roomId) {

    PlaceWantListResponseDto response = wantPlaceReaderService.getWantList(user, roomId);
    return ResponseEntity.ok(response);
  }

  @Operation(
      summary = "동행자 목록 조회",
      description = "해당 여행방의 동행자(TravelMember) 목록을 조회합니다.",
      responses = {
        @ApiResponse(responseCode = "200", description = "동행자 목록 조회 성공"),
        @ApiResponse(
            responseCode = "404",
            description = "해당 roomId가 존재하지 않거나 동행자 목록이 없습니다.",
            content = @Content),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류", content = @Content)
      })
  @GetMapping("/{roomId}/members")
  public ResponseEntity<TravelMemberListResponseDto> getTravelMembers(
      @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long roomId) {

    TravelMemberListResponseDto response = roomService.getTravelMembers(roomId);
    return ResponseEntity.ok(response);
  }

  //    @GetMapping("/{roomId}/members")
  //    public ResponseEntity<TravelMemberListResponseDto> getTravelMembers(@PathVariable Long
  // roomId) {
  //
  //      // 더미 데이터 예시
  //      TravelMemberDto member1 =
  //          TravelMemberDto.builder()
  //              .userId(1L)
  //              .nickname("여행덕후123")
  //              .profileImg("\"profile_basic.png\"")
  //              .isFriend(false)
  //              .isOwner(true)
  //              .build();
  //
  //      TravelMemberDto member2 =
  //          TravelMemberDto.builder()
  //              .userId(2L)
  //              .nickname("빵순이")
  //              .profileImg("\"profile_basic.png\"")
  //              .isFriend(true)
  //              .isOwner(false)
  //              .build();
  //
  //      TravelMemberListResponseDto response =
  //          TravelMemberListResponseDto.builder().members(List.of(member1, member2)).build();
  //
  //      return ResponseEntity.ok(response);
  //    }

  @Operation(
      summary = "동행자 강퇴",
      description = "여행방의 방장만 특정 사용자를 강퇴할 수 있습니다.",
      responses = {
        @ApiResponse(responseCode = "200", description = "강퇴 성공"),
        @ApiResponse(responseCode = "401", description = "인증 실패 (AccessToken 누락 / 유효하지 않음 / 만료됨)"),
        @ApiResponse(responseCode = "403", description = "방장이 아닌 사용자가 강퇴를 시도함", content = @Content),
        @ApiResponse(
            responseCode = "404",
            description = "해당 roomId, 사용자 정보 또는 대상 유저를 찾을 수 없습니다.",
            content = @Content),
        @ApiResponse(responseCode = "500", description = "서버 오류", content = @Content)
      })
  @DeleteMapping("/{roomId}/kick/{targetUserId}")
  public ResponseEntity<CommonResponse> kickTravelMember(
      @AuthenticationPrincipal CustomUserDetails user,
      @PathVariable Long roomId,
      @PathVariable Long targetUserId) {

    roomService.kickMember(user, roomId, targetUserId);
    return ResponseEntity.ok(new CommonResponse("KICK_SUCCESS", "사용자가 여행방에서 강퇴되었습니다."));
  }

  @Operation(
      summary = "장소 투표",
      description = "해당 희망장소에 대해 투표를 등록합니다.",
      responses = {
        @ApiResponse(responseCode = "200", description = "장소 투표 성공"),
        @ApiResponse(responseCode = "401", description = "인증 실패 (AccessToken 누락 / 유효하지 않음 / 만료됨)"),
        @ApiResponse(responseCode = "403", description = "이미 투표한 사용자입니다.", content = @Content),
        @ApiResponse(
            responseCode = "404",
            description = "해당 wantId 또는 사용자 정보를 찾을 수 없습니다.",
            content = @Content),
        @ApiResponse(responseCode = "500", description = "서버 오류", content = @Content)
      })
  @PostMapping("/{roomId}/votes/{wantId}")
  public ResponseEntity<CommonResponse> votePlace(
      @AuthenticationPrincipal CustomUserDetails user,
      @PathVariable Long roomId,
      @PathVariable Long wantId) {
    wantPlaceService.toggleVotePlace(user, roomId, wantId);
    CommonResponse response = new CommonResponse("VOTE_SUCCESS", "장소 투표가 완료되었습니다.");
    return ResponseEntity.ok(response);
  }

  @Operation(
      summary = "커스텀 장소 추가",
      description = "사용자가 여행 방 내에서 직접 커스텀 장소를 생성합니다. 위도(lat), 경도(lng)를 기반으로 주소를 자동으로 변환하여 저장됩니다.",
      requestBody =
          @io.swagger.v3.oas.annotations.parameters.RequestBody(
              description = "커스텀 장소 생성 요청 데이터",
              required = true,
              content =
                  @Content(
                      mediaType = "application/json",
                      schema = @Schema(implementation = CustomPlaceCreateRequestDto.class))),
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "커스텀 장소 생성 성공",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = Long.class) // 반환값은 생성된 커스텀 장소 ID
                    )),
        @ApiResponse(responseCode = "400", description = "요청 데이터 유효성 실패", content = @Content),
        @ApiResponse(
            responseCode = "404",
            description = "해당 roomId에 해당하는 여행 방 없음",
            content = @Content),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류", content = @Content)
      })
  @PostMapping("/custom-place")
  public ResponseEntity<Long> createCustomPlace(
      @RequestBody CustomPlaceCreateRequestDto requestDto) {
    Long customPlaceId = roomService.createCustomPlace(requestDto);
    return ResponseEntity.ok(customPlaceId);
  }
}
