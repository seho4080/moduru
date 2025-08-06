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
      String raw = new String(message.getBody());
      ScheduleMessageResponseDto schedule =
          objectMapper.readValue(raw, ScheduleMessageResponseDto.class);
      String topic = new String(message.getChannel());
      messagingTemplate.convertAndSend(topic, schedule);
    } catch (Exception e) {
      log.error("[스케줄 메시지 처리 에러]", e);
    }
  }
}
