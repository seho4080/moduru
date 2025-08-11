package com.B108.tripwish.websocket.service;

import java.util.Map;

import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import com.B108.tripwish.websocket.dto.redis.DayScheduleRedisDto;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RedisScheduleService {

  private final RedisTemplate<String, Object> redisTemplate;

  public void saveSchedule(String redisKey, Integer day, DayScheduleRedisDto scheduleDto) {
    HashOperations<String, Integer, DayScheduleRedisDto> ops = redisTemplate.opsForHash();
    ops.put(redisKey, day, scheduleDto);
  }

  public Map<Integer, DayScheduleRedisDto> getSchedule(String redisKey) {
    HashOperations<String, Integer, DayScheduleRedisDto> ops = redisTemplate.opsForHash();
    return ops.entries(redisKey);
  }

  public void deleteSchedule(String redisKey) {
    redisTemplate.delete(redisKey);
  }
}
