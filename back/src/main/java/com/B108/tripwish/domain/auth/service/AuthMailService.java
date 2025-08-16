package com.B108.tripwish.domain.auth.service;

import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.B108.tripwish.domain.auth.dto.response.AuthNumberResponse;
import com.B108.tripwish.global.exception.CustomException;
import com.B108.tripwish.global.exception.ErrorCode;
import com.B108.tripwish.global.util.RandomGenerator;
import com.B108.tripwish.global.util.RedisUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthMailService {

  // RedisUtil 이 밀리초 TTL 을 기대한다고 가정 (기존 코드와 동일)
  private static final long EXPIRATION = 30 * 60 * 1000L; // 30분

  private final RedisUtil redisUtil;
  private final RandomGenerator randomGenerator;
  private final SendMailService sendMailService;
  private final RateLimitService rateLimitService;

  /** ✅ 새 시그니처: 컨트롤러는 이 메서드만 호출하세요. - 내부에서 email 정규화 + 키 생성 + 레이트리밋 + 저장/발송까지 처리 */
  @Transactional
  public AuthNumberResponse sendCodeEmail(String emailRaw) {
    String email = norm(emailRaw);
    long key = keyOf(email); // Long 키를 써야 하는 현재 Redis/RateLimit 제약을 맞춤

    // 1) 전송 제한 확인
    if (!rateLimitService.checkAPICall(key)) {
      throw new CustomException(ErrorCode.TOO_MANY_REQUESTS);
    }

    // 2) 인증번호 생성 (앞자리 0 손실 방지 위해 저장은 문자열로)
    int authNumber = randomGenerator.makeRandomNumber();
    String code = String.valueOf(authNumber);

    // 3) 이메일 발송
    String title = "[MODURU] 회원 가입 인증 이메일입니다.";
    String content = "[MODURU] 모두루 회원가입을 환영합니다! <br><br> 인증 번호는 " + code + " 입니다.";
    sendMailService.sendEmail(email, title, content);

    // 4) Redis 저장 (마지막 코드만 유효)
    redisUtil.saveAuthNumber(key, code, EXPIRATION);

    // 5) 응답 반환 (개발 중 확인용)
    log.info("[MAIL][SAVE] email={} key={} code={}", email, key, code);
    return new AuthNumberResponse(authNumber);
  }

  /**
   * ⛳ 기존 시그니처 호환용 (프로젝트 어딘가에서 여전히 (email, key)로 부르면 여기로 들어오게) - 넘어온 key 는 무시하고, 내부 규칙으로 다시
   * 계산합니다(일관성 보장).
   */
  @Deprecated
  @Transactional
  public AuthNumberResponse sendCodeEmail(String email, Long ignoredKey) {
    return sendCodeEmail(email);
  }

  /** ✅ 코드 검증: 저장 키 규칙과 동일하게 email 정규화 → 키 계산 → 비교 */
  public boolean verifyCode(String emailRaw, String codeRaw) {
    String email = norm(emailRaw);
    long key = keyOf(email);

    String input = codeRaw == null ? "" : codeRaw.trim();
    String savedCode = redisUtil.getAuthNumber(key);

    log.info("[MAIL][VERIFY] email={} key={} input='{}' saved='{}'", email, key, input, savedCode);

    boolean ok = savedCode != null && savedCode.equals(input);
    if (ok) {
      // 인증 완료 표시 (필요 시 email 자체로 별도 플래그 저장)
      redisUtil.saveVerifiedEmail(email, EXPIRATION);
    }
    return ok;
  }

  /** 이메일 정규화: 공백 제거 + 소문자 */
  private static String norm(String s) {
    return s == null ? "" : s.trim().toLowerCase(Locale.ROOT);
  }

  /**
   * ⚠️ 현재 Redis/RateLimit 이 Long 키를 요구해서 해시를 씁니다. 가능한 빨리 String 키(예: "EMAIL:CODE:"+email)로 마이그레이션
   * 권장.
   */
  private static long keyOf(String normalizedEmail) {
    return (long) normalizedEmail.hashCode();
  }
}
