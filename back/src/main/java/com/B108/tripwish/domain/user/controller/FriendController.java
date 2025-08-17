package com.B108.tripwish.domain.user.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.user.dto.request.FriendRequestDto;
import com.B108.tripwish.domain.user.dto.response.FriendResponseDto;
import com.B108.tripwish.domain.user.service.FriendService;
import com.B108.tripwish.global.common.dto.CommonResponse;

import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/friends")
@RequiredArgsConstructor
public class FriendController {

  private final FriendService friendService;

  @Operation(summary = "친구 추가", description = "로그인한 사용자가 친구를 추가합니다.")
  @PostMapping
  public ResponseEntity<CommonResponse> addFriend(
      @AuthenticationPrincipal CustomUserDetails currentUser,
      @org.springframework.web.bind.annotation.RequestBody FriendRequestDto request) {

    friendService.addFriend(currentUser, request.getFriendId());
    return ResponseEntity.ok(new CommonResponse("FRIEND_ADDED", "친구가 추가되었습니다."));
  }

  @Operation(summary = "친구 삭제", description = "로그인한 사용자가 친구를 삭제합니다.")
  @DeleteMapping
  public ResponseEntity<CommonResponse> removeFriend(
      @AuthenticationPrincipal CustomUserDetails currentUser,
      @org.springframework.web.bind.annotation.RequestBody FriendRequestDto request) {

    friendService.removeFriend(currentUser, request.getFriendId());
    return ResponseEntity.ok(new CommonResponse("FRIEND_REMOVED", "친구가 삭제되었습니다."));
  }

  @Operation(summary = "친구 목록 조회", description = "로그인한 사용자의 친구 목록을 조회합니다.")
  @GetMapping
  public ResponseEntity<List<FriendResponseDto>> getFriends(
      @AuthenticationPrincipal CustomUserDetails currentUser) {

    List<FriendResponseDto> friends = friendService.getFriends(currentUser);
    return ResponseEntity.ok(friends);
  }
}
