package com.B108.tripwish.config;

import java.time.Clock;
import java.time.ZoneId;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class TimeConfig {
  @Bean
  public Clock seoulClock() {
    return Clock.system(ZoneId.of("Asia/Seoul"));
  }
}
