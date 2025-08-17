package com.B108.tripwish.global.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
  // 인증 관련
  LOGIN_FAILED("아이디 또는 비밀번호가 일치하지 않습니다.", HttpStatus.UNAUTHORIZED),
  LOGOUT_FAILED("로그아웃 처리 중 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR),
  USER_NOT_FOUND("해당 사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),

  TOO_MANY_REQUESTS("요청이 너무 많습니다.", HttpStatus.TOO_MANY_REQUESTS),

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
  EMAIL_NOT_VERIFIED("이메일 인증이 완료되지 않았습니다.", HttpStatus.FORBIDDEN),
  INVALID_NICKNAME_FORMAT("올바르지 않은 닉네임 형식입니다.", HttpStatus.BAD_REQUEST),
  INVALID_PASSWORD_FORMAT("올바르지 않은 비밀번호 형식입니다.", HttpStatus.BAD_REQUEST),

  // ROOM 관련 추가 예외
  ROOM_KICK_FORBIDDEN("방장이 아니므로 강퇴할 수 없습니다.", HttpStatus.FORBIDDEN),
  CANNOT_KICK_SELF("자기 자신은 강퇴할 수 없습니다.", HttpStatus.BAD_REQUEST),
  ROOM_CANNOT_LEAVE_ONLY_OWNER("방장이 유일한 멤버일 경우 탈퇴할 수 없습니다.", HttpStatus.BAD_REQUEST),

  // AI 호출 관련 실패
  BAD_REQUEST("잘못된 요청입니다.", HttpStatus.BAD_REQUEST),
  AI_SERVER_ERROR("AI 서버 호출 중 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR),

  // 존재하지 않는 데이터
  ROOM_NOT_FOUND("해당 여행방 정보가 존재하지 않습니다.", HttpStatus.NOT_FOUND),
  ROOM_MEMBER_NOT_FOUND("해당 여행 멤버가 존재하지 않습니다.", HttpStatus.NOT_FOUND),
  CATEGORY_NOT_FOUND("해당 카테고리를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
  PLACE_NOT_FOUND("해당 장소를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
  RESTAURANT_DETAIL_NOT_FOUND("해당 장소를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
  SPOT_DETAIL_NOT_FOUND("해당 장소를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
  FESTIVAL_DETAIL_NOT_FOUND("해당 장소를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
  WANT_PLACE_NOT_FOUND("해당 장소를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
  CUSTOM_PLACE_NOT_FOUND("해당 장소를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
  REVIEW_TAG_NOT_FOUND("리뷰 태그를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
  REGION_NOT_FOUND("해당 지역을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
  SCHEDULE_NOT_FOUND("해당 일정을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),

  // 초대 토큰 관련
  INVALID_INVITE_TOKEN("유효하지 않은 초대 토큰입니다.", HttpStatus.BAD_REQUEST),
  EXPIRED_INVITE_TOKEN("만료된 초대 토큰입니다.", HttpStatus.GONE),

  // AI 관련
  AI_BAD_RESPONSE("AI 서버 응답 형식이 올바르지 않습니다.", HttpStatus.BAD_GATEWAY),

  // 파일 삭제 관련
  FILE_DELETE_FAIL("이미지 삭제 중 오류가 발생했습니다.", HttpStatus.BAD_REQUEST),

  // 접근 권한 관련
  NO_PERMISSION("접근 권한이 없습니다.", HttpStatus.FORBIDDEN),
  ROOM_DELETE_FORBIDDEN("방 삭제 권한이 없습니다.", HttpStatus.FORBIDDEN),
  ROOM_FORBIDDEN("해당 방에 대한 권한이 없습니다.", HttpStatus.FORBIDDEN),

  INVALID_OPTION("유효하지 않은 정렬 방식 또는 필터입니다", HttpStatus.BAD_REQUEST),
  UNSUPPORTED_CATEGORY_TYPE("지원하지 않는 카테고리 타입입니다.", HttpStatus.BAD_REQUEST),
  UNSUPPORTED_PLACE_TYPE("지원하지 않는 장소 타입입니다.", HttpStatus.BAD_REQUEST),

  // 일정 저장 관련
  SCHEDULE_VERSION_CONFLICT("일정 버전이 일치하지 않습니다.", HttpStatus.CONFLICT),
  SCHEDULE_EMPTY_DRAFT("저장할 일정이 없습니다.", HttpStatus.BAD_REQUEST),

  // 중복 방지
  DUPLICATE_WANT_PLACE("이미 희망장소에 추가된 장소입니다.", HttpStatus.CONFLICT);

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
