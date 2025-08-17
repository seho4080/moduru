package com.B108.tripwish.websocket.service;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

@Service
public class RedisPublisher {

  private final RedisTemplate<String, Object> redisTemplate;
  private final ObjectMapper objectMapper;

  public RedisPublisher(RedisTemplate<String, Object> redisTemplate) {
    this.redisTemplate = redisTemplate;
    this.objectMapper =
        new ObjectMapper()
            .registerModule(new JavaTimeModule()) // ✅ Java 8 시간 타입 모듈 등록
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS); // ✅ "2025-07-01" 형식으로 직렬화
  }

  public void publish(RedisChannelType channelType, Object message) {

    redisTemplate.convertAndSend(channelType.getChannel(), message);
  }
}
