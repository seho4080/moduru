package com.B108.tripwish.websocket.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RedisPublisher {

    private final RedisTemplate<String, Object> redisTemplate;

    public void publish(RedisChannelType channelType, Object message) {
        redisTemplate.convertAndSend(channelType.getChannel(), message);
    }
}
