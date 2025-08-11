package com.B108.tripwish.websocket.subscriber;

import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Component;

import com.B108.tripwish.websocket.dto.response.ScheduleMessageResponseDto;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class ScheduleRedisSubscriber implements MessageListener {

  private final ObjectMapper objectMapper;
  private final SimpMessageSendingOperations messagingTemplate;

  @Override
  public void onMessage(Message message, byte[] pattern) {
    try {
      // 1. Redis에서 받은 메시지 JSON 문자열로 디코딩
      String raw = new String(message.getBody(), "UTF-8");

      // 2. JSON → DTO 변환
      ScheduleMessageResponseDto schedule =
              objectMapper.readValue(raw, ScheduleMessageResponseDto.class);

      // 3. Redis 채널
      String topic = "/topic/room/" + schedule.getRoomId() + "/schedule";

      // 4. WebSocket 브로드캐스트
      messagingTemplate.convertAndSend(topic, schedule);

      log.info("📣 Redis 메시지 → WebSocket 전송 완료: topic={}, day={}", topic, schedule.getDay());
    } catch (Exception e) {
      log.error("❌ [스케줄 메시지 처리 에러]", e);
    }
  }
}
