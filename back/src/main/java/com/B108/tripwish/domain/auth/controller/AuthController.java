package com.B108.tripwish.domain.auth.controller;

import com.B108.tripwish.global.util.CookieUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.B108.tripwish.domain.auth.dto.JwtToken;
import com.B108.tripwish.domain.auth.dto.request.LoginRequestDto;
import com.B108.tripwish.domain.auth.dto.response.LoginResponseDto;
import com.B108.tripwish.domain.auth.dto.response.ReissueResponseDto;
import com.B108.tripwish.domain.auth.service.AuthService;
import com.B108.tripwish.global.common.dto.CommonResponse;
import com.B108.tripwish.global.exception.CustomException;
import com.B108.tripwish.global.exception.ErrorCode;
import com.B108.tripwish.global.exception.ErrorResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {
  private final AuthService authService;

  @Operation(
      summary = "로그인",
      description = "이메일과 비밀번호로 로그인하고 Access Token과 Refresh Token을 발급받습니다.",
      requestBody =
          @io.swagger.v3.oas.annotations.parameters.RequestBody(
              required = true,
              description = "로그인 요청 정보",
              content = @Content(schema = @Schema(implementation = LoginRequestDto.class))),
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "로그인 성공. 토큰 반환",
            content = @Content(schema = @Schema(implementation = LoginResponseDto.class))),
        @ApiResponse(
            responseCode = "401",
            description = "로그인 실패 - 이메일 또는 비밀번호 불일치",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
      })
  @PostMapping("/login")
  public LoginResponseDto login(@RequestBody LoginRequestDto login, HttpServletResponse response) {
    String email = login.getEmail();
    String password = login.getPassword();
    JwtToken jwtToken = authService.login(email, password, response);
    log.info(
            "jwtToken accessToken = {}, refreshToken = {}",
            jwtToken.getAccessToken(),
            jwtToken.getRefreshToken());
    return new LoginResponseDto(jwtToken.getAccessToken(), jwtToken.getRefreshToken()); // 개발 중 응답 확인용
//    return ResponseEntity.ok(new CommonResponse("LOGIN_SUCCESS", "로그인이 완료되었습니다.");
  }

  @Operation(
      summary = "로그아웃",
      description =
          "현재 로그인한 사용자가 로그아웃을 시도합니다. Access Token을 기반으로 처리되며, 서버 측에서 해당 토큰을 무효화하거나 블랙리스트에 등록할 수 있습니다.",
      parameters = {
        @Parameter(
            name = "Authorization",
            description = "Access Token (예: Bearer {accessToken})",
            required = true,
            in = ParameterIn.HEADER,
            example = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
      },
      responses = {
        @ApiResponse(responseCode = "200", description = "로그아웃 성공"),
        @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자", content = @Content),
        @ApiResponse(responseCode = "401", description = "만료된 Access Token", content = @Content),
        @ApiResponse(
            responseCode = "401",
            description = "유효하지 않은 Access Token",
            content = @Content),
        @ApiResponse(responseCode = "500", description = "서버 오류", content = @Content)
      })
  @PostMapping("/logout")
  public ResponseEntity<CommonResponse> logout(HttpServletRequest request, HttpServletResponse response) {
    String accessToken = CookieUtil.getCookieValue(request, "access_token");
    if (accessToken == null) {
      throw new CustomException(ErrorCode.INVALID_ACCESS_TOKEN);
    }

    // 서비스 호출
    authService.logout(accessToken);

    // 쿠키 삭제 처리
    Cookie accessTokenCookie = new Cookie("access_token", null);
    accessTokenCookie.setMaxAge(0); // 즉시 만료
    accessTokenCookie.setPath("/");
    accessTokenCookie.setHttpOnly(true);
    accessTokenCookie.setSecure(false); // 배포 시 true

    Cookie refreshTokenCookie = new Cookie("refresh_token", null);
    refreshTokenCookie.setMaxAge(0);
    refreshTokenCookie.setPath("/");
    refreshTokenCookie.setHttpOnly(true);
    refreshTokenCookie.setSecure(false); // 배포 시 true

    response.addCookie(accessTokenCookie);
    response.addCookie(refreshTokenCookie);

    return ResponseEntity.ok(new CommonResponse("SUCCESS", "로그아웃이 정상적으로 처리되었습니다."));
  }

  @Operation(
      summary = "토큰 재발급",
      description = "Refresh Token을 Authorization 헤더로 전달하여 새로운 Access/Refresh Token을 발급받습니다.",
      security = @SecurityRequirement(name = ""),
      parameters = {
        @Parameter(
            name = "Authorization",
            description = "Refresh Token (예: Bearer {refreshToken})",
            required = true,
            in = ParameterIn.HEADER,
            example = "Bearer eyJhbGciOiJIUzI1NiJ9...")
      },
      responses = {
        @ApiResponse(responseCode = "200", description = "토큰 재발급 성공"),
        @ApiResponse(
            responseCode = "400",
            description = "유효하지 않은 Refresh Token 요청입니다.",
            content = @Content),
        @ApiResponse(
            responseCode = "401",
            description = "Refresh Token이 만료되었거나 인증되지 않음",
            content = @Content),
        @ApiResponse(responseCode = "500", description = "서버 오류", content = @Content)
      })
  @PostMapping("/reissue")
  public ReissueResponseDto reissue(HttpServletRequest request, HttpServletResponse response) {
    String refreshToken = CookieUtil.getCookieValue(request, "refresh_token");
    if (refreshToken == null) {
      throw new CustomException(ErrorCode.INVALID_REFRESH_TOKEN);
    }
    JwtToken token = authService.reissue(refreshToken);
    Cookie accessTokenCookie = new Cookie("access_token", token.getAccessToken());
    accessTokenCookie.setHttpOnly(true);
    accessTokenCookie.setSecure(false); // 배포 시 true
    accessTokenCookie.setPath("/");
    accessTokenCookie.setMaxAge(60 * 60); // 1시간
    response.addCookie(accessTokenCookie);

    Cookie refreshTokenCookie = new Cookie("refresh_token", token.getRefreshToken());
    refreshTokenCookie.setHttpOnly(true);
    refreshTokenCookie.setSecure(false); // 배포 시 true
    refreshTokenCookie.setPath("/");
    refreshTokenCookie.setMaxAge(7 * 24 * 60 * 60); // 7일
    response.addCookie(refreshTokenCookie);

    return new ReissueResponseDto(token.getAccessToken(), token.getRefreshToken());
  }
}
