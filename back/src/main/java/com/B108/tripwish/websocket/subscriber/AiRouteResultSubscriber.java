// src/main/java/com/B108/tripwish/websocket/subscriber/AiRouteResultSubscriber.java
package com.B108.tripwish.websocket.subscriber;

import com.B108.tripwish.websocket.service.RedisChannelType;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiRouteResultSubscriber implements MessageListener {

    private final ObjectMapper om;
    private final SimpMessagingTemplate stomp;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String raw = new String(message.getBody(), StandardCharsets.UTF_8);
        log.info("[AI-ROUTE][RESULT] 📩 Redis message 수신 (raw): {}", raw);
        if (pattern != null) {
            log.debug("[AI-ROUTE][RESULT] 📡 Channel Pattern: {}", new String(pattern, StandardCharsets.UTF_8));
        }

        try {
            Map<String, Object> m = om.readValue(message.getBody(), new TypeReference<>() {});
            log.debug("[AI-ROUTE][RESULT] ✅ 파싱 완료: {}", m);

            Object roomIdObj = m.get("roomId");
            if (roomIdObj == null) {
                log.warn("[AI-ROUTE][RESULT] ⚠ roomId 누락. 메시지 무시: {}", m);
                return;
            }
            Long roomId = Long.valueOf(String.valueOf(roomIdObj));

            String dest = "/topic/room/" + roomId + "/ai-route/result";
            log.info("[AI-ROUTE][RESULT] 📤 STOMP 전송 경로: {}", dest);
            stomp.convertAndSend(dest, m);
            log.info("[AI-ROUTE][RESULT] ✅ STOMP 전송 완료 (roomId: {})", roomId);

        } catch (Exception e) {
            log.warn("[AI-ROUTE][RESULT] ❌ onMessage error: {}", e.getMessage(), e);
        }
    }

    public String channel() {
        return RedisChannelType.AI_ROUTE_RESULT.getChannel();
    }
}
