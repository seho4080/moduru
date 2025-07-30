package com.B108.tripwish.domain.user.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.B108.tripwish.domain.user.dto.SignUpRequestDto;
import com.B108.tripwish.domain.user.service.UserService;
import com.B108.tripwish.global.dto.CommonResponse;

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
}
