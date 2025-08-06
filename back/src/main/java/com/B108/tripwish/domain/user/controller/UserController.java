package com.B108.tripwish.domain.user.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.user.dto.request.SignUpRequestDto;
import com.B108.tripwish.domain.user.dto.request.UpdateUserRequestDto;
import com.B108.tripwish.domain.user.dto.response.InfoUserResponseDto;
import com.B108.tripwish.domain.user.dto.response.UserTravelRoomResponseDto;
import com.B108.tripwish.domain.user.service.UserService;
import com.B108.tripwish.global.common.dto.CommonResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/users")
public class UserController {

  private final UserService userService;

  @Operation(
      summary = "회원가입",
      description = "사용자가 이메일, 비밀번호, 닉네임 등의 정보를 입력하여 회원가입을 수행합니다.",
      requestBody =
          @io.swagger.v3.oas.annotations.parameters.RequestBody(
              description = "회원가입 요청 DTO",
              required = true),
      responses = {
        @ApiResponse(responseCode = "201", description = "회원가입 성공"),
        @ApiResponse(responseCode = "409", description = "중복된 이메일"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청 형식"),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류", content = @Content)
      })
  @PostMapping("/signup")
  public ResponseEntity<CommonResponse> signup(@RequestBody SignUpRequestDto request) {
    userService.addUser(request);
    return ResponseEntity.ok(new CommonResponse("SIGNUP_SUCCESS", "회원가입이 완료되었습니다."));
  }

  @Operation(
      summary = "회원정보 조회",
      description = "로그인한 사용자의 정보를 조회합니다.",
      responses = {
        @ApiResponse(responseCode = "200", description = "회원 정보 조회 성공"),
        @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
        @ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음"),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류", content = @Content)
      })
  @GetMapping("/me")
  public ResponseEntity<InfoUserResponseDto> getUserInfo(
      @AuthenticationPrincipal CustomUserDetails currentUser) {

    return ResponseEntity.ok(userService.getUserInfo(currentUser));
  }

  @Operation(
      summary = "회원정보 수정",
      description = "사용자가 수정할 정보를 입력하여 회원 정보를 수정합니다.",
      requestBody =
          @io.swagger.v3.oas.annotations.parameters.RequestBody(
              description = "회원 정보 수정 요청 DTO",
              required = true),
      responses = {
        @ApiResponse(responseCode = "200", description = "회원 정보 수정 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청 형식"),
        @ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음"),
        @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류", content = @Content)
      })
  @PutMapping("/me")
  public ResponseEntity<CommonResponse> updateUser(
      @AuthenticationPrincipal CustomUserDetails currentUser,
      @RequestBody UpdateUserRequestDto request) {

    userService.updateUser(currentUser, request);
    return ResponseEntity.ok(new CommonResponse("USER_UPDATED", "회원 정보가 수정되었습니다."));
  }

  @Operation(
      summary = "회원정보 삭제",
      description = "사용자의 ID를 통해 회원 정보를 삭제합니다.",
      responses = {
        @ApiResponse(responseCode = "200", description = "회원 정보 삭제 성공"),
        @ApiResponse(responseCode = "404", description = "삭제할 사용자를 찾을 수 없음  "),
        @ApiResponse(responseCode = "400", description = "잘못된 요청 형식"),
        @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류", content = @Content)
      })
  @DeleteMapping("/me")
  public ResponseEntity<CommonResponse> deleteUser(
      @AuthenticationPrincipal CustomUserDetails currentUser) {

    userService.deleteUser(currentUser);
    return ResponseEntity.ok(new CommonResponse("USER_DELETED", "회원이 삭제되었습니다."));
  }

  @Operation(
      summary = "유저가 속한 여행 방 목록 조회",
      description = "현재 로그인한 사용자가 속해 있는 모든 여행 방 목록을 조회합니다.",
      responses = {
        @ApiResponse(responseCode = "200", description = "여행 방 목록 조회 성공"),
        @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
        @ApiResponse(responseCode = "404", description = "해당 유저 또는 여행 방을 찾을 수 없음"),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류", content = @Content)
      })
  @GetMapping("/travel-rooms")
  public ResponseEntity<List<UserTravelRoomResponseDto>> getUserTravelRooms(
      @AuthenticationPrincipal CustomUserDetails currentUser) {
    return ResponseEntity.ok(userService.getUserTravelRooms(currentUser));
  }
}
