package com.B108.tripwish.global.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
  // 인증 관련
  LOGIN_FAILED("아이디 또는 비밀번호가 일치하지 않습니다.", HttpStatus.UNAUTHORIZED),
  LOGOUT_FAILED("로그아웃 처리 중 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR),
  USER_NOT_FOUND("해당 사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),

  // Access Token 예외
  EXPIRED_ACCESS_TOKEN("만료된 Access Token입니다.", HttpStatus.UNAUTHORIZED),
  INVALID_ACCESS_TOKEN("유효하지 않은 Access Token입니다.", HttpStatus.UNAUTHORIZED),
  INVALID_ACCESS_SIGNATURE("Access Token 서명이 올바르지 않습니다.", HttpStatus.UNAUTHORIZED),

  // Refresh Token 예외
  EXPIRED_REFRESH_TOKEN("만료된 Refresh Token입니다.", HttpStatus.UNAUTHORIZED),
  INVALID_REFRESH_TOKEN("유효하지 않은 Refresh Token입니다.", HttpStatus.UNAUTHORIZED),
  INVALID_REFRESH_SIGNATURE("Refresh Token 서명이 올바르지 않습니다.", HttpStatus.UNAUTHORIZED),

  // 토큰 재발급 관련
  INVALID_REFRESH_TOKEN_REQUEST("유효하지 않은 Refresh Token 요청입니다.", HttpStatus.BAD_REQUEST),

  // 회원가입/중복 검사
  EXISTS_EMAIL("이미 가입된 이메일입니다.", HttpStatus.CONFLICT),
  EXISTS_NICKNAME("이미 사용 중인 닉네임입니다.", HttpStatus.CONFLICT),
  INVALID_NICKNAME("올바르지 않은 닉네임 형식입니다.", HttpStatus.BAD_REQUEST),

  // 존재하지 않는 데이터
  ROOM_NOT_FOUND("해당 여행방 정보가 존재하지 않습니다.", HttpStatus.NOT_FOUND),
  ROOM_MEMBER_NOT_FOUND("해당 여행 멤버가 존재하지 않습니다.", HttpStatus.NOT_FOUND),
  FOOD_NOT_FOUND("음식을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
  DIET_NOT_FOUND("해당 식사를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
  BOARD_NOT_FOUND("해당 게시글을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),

  // 파일 삭제 관련
  FILE_DELETE_FAIL("이미지 삭제 중 오류가 발생했습니다.", HttpStatus.BAD_REQUEST),

  // 접근 권한 관련
  NO_PERMISSION("접근 권한이 없습니다.", HttpStatus.FORBIDDEN),
  ROOM_DELETE_FORBIDDEN("방 삭제 권한이 없습니다.", HttpStatus.FORBIDDEN),

  INVALID_OPTION("유효하지 않은 정렬 방식 또는 필터입니다", HttpStatus.BAD_REQUEST),
  INVALID_BOARD_TYPE("유효하지 않은 게시판 타입입니다.", HttpStatus.BAD_REQUEST);

  private final String message;
  private final HttpStatus status;

  ErrorCode(String message, HttpStatus status) {
    this.message = message;
    this.status = status;
  }

  public String getMessage() {
    return message;
  }

  public HttpStatus getStatus() {
    return status;
  }

  public String getCode() {
    return this.name();
  }
}
