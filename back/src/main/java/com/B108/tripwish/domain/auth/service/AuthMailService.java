package com.B108.tripwish.domain.auth.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.B108.tripwish.domain.auth.dto.response.AuthNumberResponse;
import com.B108.tripwish.global.exception.CustomException;
import com.B108.tripwish.global.exception.ErrorCode;
import com.B108.tripwish.global.util.RandomGenerator;
import com.B108.tripwish.global.util.RedisUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthMailService {

  private static final long EXPIRATION = 30 * 60 * 1000L; // 30분

  private final RedisUtil redisUtil;
  private final RandomGenerator randomGenerator;
  private final SendMailService sendMailService;
  private final RateLimitService rateLimitService;

  @Transactional
  public AuthNumberResponse sendCodeEmail(String email, Long key) {
    // 1. 전송 제한 확인
    if (!rateLimitService.checkAPICall(key)) {
      throw new CustomException(ErrorCode.TOO_MANY_REQUESTS);
    }

    // 2. 인증번호 생성
    int authNumber = randomGenerator.makeRandomNumber();

    // 3. 이메일 발송
    String title = "회원 가입 인증 이메일입니다.";
    String content = "인증 번호는 " + authNumber + "입니다.";
    sendMailService.sendEmail(email, title, content);

    // 4. Redis 저장
    redisUtil.saveAuthNumber(key, String.valueOf(authNumber), EXPIRATION);

    // 5. 응답 반환
    return new AuthNumberResponse(authNumber);
  }

  public boolean verifyCode(String email, String code) {
    String savedCode = redisUtil.getAuthNumber((long) email.hashCode());
    if (savedCode != null && savedCode.equals(code)) {
      // 인증 완료 표시
      redisUtil.saveVerifiedEmail(email, EXPIRATION);
      return true;
    }
    return false;
  }
}
