package com.B108.tripwish.global.util;

import java.util.concurrent.TimeUnit;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class RedisUtil {

  private final RedisTemplate<String, String> redisTemplate;

  public void saveAuthNumber(Long key, String authNumber, Long expiration) {
    redisTemplate
        .opsForValue()
        .set("AuthNumber" + key, authNumber, expiration, TimeUnit.MILLISECONDS);
  }

  public String getAuthNumber(Long key) {
    return redisTemplate.opsForValue().get("AuthNumber" + key);
  }

  public void saveVerifiedEmail(String email, long ttlMillis) {
    redisTemplate
        .opsForValue()
        .set("email:verified:" + email, "true", ttlMillis, TimeUnit.MILLISECONDS);
  }

  public boolean isVerified(String email) {
    return "true".equals(redisTemplate.opsForValue().get("email:verified:" + email));
  }

  public void saveAPICall(Long key, String count, Long expiration) {
    redisTemplate.opsForValue().set("APICall" + key, count, expiration, TimeUnit.MILLISECONDS);
  }

  public String findAPICallByKey(Long key) {
    return redisTemplate.opsForValue().get("APICall" + key);
  }

  public void updateAPICall(Long key, String newCount) {
    redisTemplate.opsForValue().set("APICall" + key, newCount);
  }
}
