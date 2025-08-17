// src/main/java/com/B108/tripwish/websocket/subscriber/AiRouteStatusSubscriber.java
package com.B108.tripwish.websocket.subscriber;

import java.nio.charset.StandardCharsets;
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
public class AiRouteStatusSubscriber implements MessageListener {

  private final ObjectMapper om;
  private final SimpMessagingTemplate stomp;

  @Override
  public void onMessage(Message message, byte[] pattern) {
    String raw = new String(message.getBody(), StandardCharsets.UTF_8);
    log.info("[AI-ROUTE][STATUS] 📥 Raw Redis Message: {}", raw);
    if (pattern != null) {
      log.debug(
          "[AI-ROUTE][STATUS] 📡 Channel Pattern: {}", new String(pattern, StandardCharsets.UTF_8));
    }

    try {
      Map<String, Object> m = om.readValue(message.getBody(), new TypeReference<>() {});
      log.debug("[AI-ROUTE][STATUS] ✅ Parsed Message Map: {}", m);

      Object roomIdObj = m.get("roomId");
      if (roomIdObj == null) {
        log.warn("[AI-ROUTE][STATUS] ⚠ roomId 누락. 메시지 무시: {}", m);
        return;
      }
      Long roomId = Long.valueOf(String.valueOf(roomIdObj));
      log.info("[AI-ROUTE][STATUS] 🏠 Room ID: {}", roomId);

      String dest = "/topic/room/" + roomId + "/ai-route/status";
      log.info("[AI-ROUTE][STATUS] 🚀 Sending to STOMP Destination: {}", dest);

      stomp.convertAndSend(dest, m);
      log.info("[AI-ROUTE][STATUS] 🎯 STOMP Message Sent Successfully");

    } catch (Exception e) {
      log.warn("[AI-ROUTE][STATUS] ❌ onMessage error: {}", e.getMessage(), e);
    }
  }

  public String channel() {
    return RedisChannelType.AI_ROUTE_STATUS.getChannel();
  }
}
