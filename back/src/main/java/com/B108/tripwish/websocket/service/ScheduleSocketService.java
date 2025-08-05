package com.B108.tripwish.websocket.service;

import org.springframework.stereotype.Service;

import com.B108.tripwish.websocket.dto.request.ScheduleMessageRequestDto;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ScheduleSocketService {

  private final RedisPublisher redisPublisher;

  public void broadcastSchedule(String roomId, ScheduleMessageRequestDto message) {
    String topic = "/topic/room/" + roomId + "/schedule";
    redisPublisher.publish(topic, message);
  }
}
