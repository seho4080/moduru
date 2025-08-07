package com.B108.tripwish.websocket.service;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RedisPublisher {

  private final RedisTemplate<String, Object> redisTemplate;

  public void publish(RedisChannelType channelType, Object message) {
    redisTemplate.convertAndSend(channelType.getChannel(), message);
  }
}
