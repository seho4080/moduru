package com.B108.tripwish.websocket.service;

import org.springframework.stereotype.Service;

import com.B108.tripwish.websocket.dto.request.ScheduleMessageRequestDto;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ScheduleSocketService {

  private final RedisPublisher redisPublisher;

  public void broadcastSchedule(String roomId, ScheduleMessageRequestDto message) {

    // Redis 발행 시에는 WebSocket topic이 아닌 Redis 채널명을 써야 함
    redisPublisher.publish(RedisChannelType.SCHEDULE_UPDATE, message);
  }
}
