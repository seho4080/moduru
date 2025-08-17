package com.B108.tripwish.global.util;

import java.util.Random;

import org.springframework.stereotype.Component;

@Component
public class RandomGenerator {
  private static final Random random = new Random();

  public int makeRandomNumber() {
    // 난수의 범위 111111 ~ 999999 (6자리 난수)
    return random.nextInt(888888) + 111111;
  }
}
