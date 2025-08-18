package com.B108.tripwish.domain.auth.service;

import org.springframework.stereotype.Service;

import com.B108.tripwish.global.util.RedisUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RateLimitService {

  private static final int MAX_API_CALL = 10;
  private static final Long EXPIRATION = 1800000L; // 30분
  private final RedisUtil redisUtil;

  public boolean checkAPICall(Long key) {
    String apiCall = redisUtil.findAPICallByKey(key);

    if (apiCall == null) {
      redisUtil.saveAPICall(key, "1", EXPIRATION);
      return true;
    } else if (Integer.parseInt(apiCall) < MAX_API_CALL) {
      redisUtil.updateAPICall(key, String.valueOf(Integer.parseInt(apiCall) + 1));
      return true;
    }
    return false;
  }
}
