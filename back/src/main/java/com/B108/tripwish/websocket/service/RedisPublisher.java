package com.B108.tripwish.websocket.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RedisPublisher {

  private final RedisTemplate<String, Object> redisTemplate;
  private final ObjectMapper objectMapper = new ObjectMapper();
  public void publish(RedisChannelType channelType, Object message) {
    try {
      String jsonMessage = objectMapper.writeValueAsString(message);
      redisTemplate.convertAndSend(channelType.getChannel(), jsonMessage);
    } catch (JsonProcessingException e) {
      throw new RuntimeException("Redis publish JSON 변환 실패", e);
    }
  }
}
