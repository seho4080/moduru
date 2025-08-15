package com.B108.tripwish.websocket.subscriber;

import java.util.Map;

import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import com.B108.tripwish.websocket.service.RedisChannelType;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiScheduleResultSubscriber implements MessageListener {

  private final ObjectMapper om;
  private final SimpMessagingTemplate stomp;

  @Override
  public void onMessage(Message message, byte[] pattern) {
    log.info("[AI-SCHEDULE][RESULT] 📩 Redis message 수신 (raw): {}", new String(message.getBody()));

    try {
      Map<String, Object> m = om.readValue(message.getBody(), new TypeReference<>() {});
      log.debug("[AI-SCHEDULE][RESULT] ✅ 파싱 완료: {}", m);

      Long roomId = Long.valueOf(String.valueOf(m.get("roomId")));
      String dest = "/topic/room/" + roomId + "/ai-schedule/result";

      log.info("[AI-SCHEDULE][RESULT] 📤 STOMP 전송 경로: {}", dest);
      stomp.convertAndSend(dest, m);
      log.info("[AI-SCHEDULE][RESULT] ✅ STOMP 전송 완료 (roomId: {})", roomId);

    } catch (Exception e) {
      log.warn("[AI-SCHEDULE][RESULT] ❌ onMessage error: {}", e.getMessage(), e);
    }
  }

  public String channel() {
    return RedisChannelType.AI_SCHEDULE_RESULT.getChannel();
  }
}
