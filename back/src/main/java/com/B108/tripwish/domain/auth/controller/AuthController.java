package com.B108.tripwish.domain.auth.controller;

import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.B108.tripwish.domain.auth.dto.JwtToken;
import com.B108.tripwish.domain.auth.dto.request.EmailRequestDto;
import com.B108.tripwish.domain.auth.dto.request.EmailVerifyRequestDto;
import com.B108.tripwish.domain.auth.dto.request.LoginRequestDto;
import com.B108.tripwish.domain.auth.dto.response.LoginResponseDto;
import com.B108.tripwish.domain.auth.dto.response.ReissueResponseDto;
import com.B108.tripwish.domain.auth.service.AuthMailService;
import com.B108.tripwish.domain.auth.service.AuthService;
import com.B108.tripwish.global.common.dto.CommonResponse;
import com.B108.tripwish.global.exception.CustomException;
import com.B108.tripwish.global.exception.ErrorCode;
import com.B108.tripwish.global.exception.ErrorResponse;
import com.B108.tripwish.global.util.CookieUtil;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {
  private final AuthService authService;
  private final AuthMailService authMailService;
  private final Environment env;

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
  public LoginResponseDto login(
      @RequestBody LoginRequestDto login,
      HttpServletResponse response,
      HttpServletRequest request // ★ 추가
      ) {
    String email = login.getEmail();
    String password = login.getPassword();
    JwtToken jwtToken = authService.login(email, password, response, request); // ★ 수정
    log.info(
        "jwtToken accessToken = {}, refreshToken = {}",
        jwtToken.getAccessToken(),
        jwtToken.getRefreshToken());
    return new LoginResponseDto(jwtToken.getAccessToken(), jwtToken.getRefreshToken());
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
  public ResponseEntity<CommonResponse> logout(
      HttpServletRequest request, HttpServletResponse response) {
    String accessToken = CookieUtil.getCookieValue(request, "access_token");
    if (accessToken == null) {
      throw new CustomException(ErrorCode.INVALID_ACCESS_TOKEN);
    }

    authService.logout(accessToken);

    Cookie accessTokenCookie = new Cookie("access_token", null);
    accessTokenCookie.setMaxAge(0);
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
    JwtToken token = authService.reissue(refreshToken, response, request); // ★ 수정

    return new ReissueResponseDto(token.getAccessToken(), token.getRefreshToken());
  }

  @Operation(
      summary = "이메일 인증 코드 전송",
      description = "회원가입 시 이메일로 인증 코드를 발송합니다.",
      requestBody =
          @io.swagger.v3.oas.annotations.parameters.RequestBody(
              required = true,
              description = "이메일 주소",
              content = @Content(schema = @Schema(implementation = EmailRequestDto.class))),
      responses = {
        @ApiResponse(responseCode = "200", description = "인증 코드 전송 성공"),
        @ApiResponse(responseCode = "429", description = "요청 제한 초과"),
        @ApiResponse(responseCode = "500", description = "서버 오류")
      })
  @PostMapping("/email/send")
  public ResponseEntity<CommonResponse> sendAuthCode(@RequestBody EmailRequestDto requestDto) {
    long start = System.currentTimeMillis();
    log.info(
        "MAIL CHECK → user={}, pw.len={}, pw='{}'",
        env.getProperty("spring.mail.username"),
        env.getProperty("spring.mail.password", "").length(),
        env.getProperty("spring.mail.password"));
    log.info("[AUTH][EMAIL][SEND] >> request email={}", requestDto.getEmail());
    try {
      Long key = (long) requestDto.getEmail().hashCode();
      authMailService.sendCodeEmail(requestDto.getEmail(), key);
      log.info(
          "[AUTH][EMAIL][SEND] << dispatched (async) key={} in {}ms",
          key,
          System.currentTimeMillis() - start);
      return ResponseEntity.ok(new CommonResponse("CODE_SENT", "인증번호가 발송되었습니다."));
    } catch (Exception e) {
      log.error(
          "[AUTH][EMAIL][SEND] !! error email={} msg={}", requestDto.getEmail(), e.getMessage(), e);
      throw e;
    }
  }

  @Operation(
      summary = "이메일 인증 코드 검증",
      description = "사용자가 입력한 인증 코드가 이메일에 발송된 코드와 일치하는지 확인합니다.",
      requestBody =
          @io.swagger.v3.oas.annotations.parameters.RequestBody(
              required = true,
              description = "이메일 주소와 인증 코드",
              content = @Content(schema = @Schema(implementation = EmailVerifyRequestDto.class))),
      responses = {
        @ApiResponse(responseCode = "200", description = "이메일 인증 성공"),
        @ApiResponse(responseCode = "400", description = "인증 코드 불일치 또는 인증 실패"),
        @ApiResponse(responseCode = "500", description = "서버 오류")
      })
  @PostMapping("/email/verify")
  public ResponseEntity<CommonResponse> verifyAuthCode(
      @RequestBody EmailVerifyRequestDto requestDto) {
    log.info(
        "[AUTH][EMAIL][VERIFY] >> email={} code={}", requestDto.getEmail(), requestDto.getCode());
    boolean result = authMailService.verifyCode(requestDto.getEmail(), requestDto.getCode());
    log.info("[AUTH][EMAIL][VERIFY] << result={}", result);
    if (result) return ResponseEntity.ok(new CommonResponse("EMAIL_VERIFIED", "이메일 인증이 완료되었습니다."));
    else throw new CustomException(ErrorCode.EMAIL_NOT_VERIFIED);
  }
}
