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

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiScheduleStatusSubscriber implements MessageListener {

    private final ObjectMapper om;                // GenericJackson2JsonRedisSerializer 쓰면 그대로 파싱됨
    private final SimpMessagingTemplate stomp;   // STOMP로 프론트에 브로드캐스트

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            // 1. 원본 메시지 로그
            String raw = new String(message.getBody());
            log.info("[AI-SCHEDULE][STATUS] 📥 Raw Redis Message: {}", raw);

            // 2. 패턴 로그
            if (pattern != null) {
                log.info("[AI-SCHEDULE][STATUS] 📡 Channel Pattern: {}", new String(pattern));
            }

            // 3. JSON 파싱
            Map<String, Object> m = om.readValue(message.getBody(), new TypeReference<>() {});
            log.info("[AI-SCHEDULE][STATUS] ✅ Parsed Message Map: {}", m);

            // 4. roomId 추출
            Long roomId = Long.valueOf(String.valueOf(m.get("roomId")));
            log.info("[AI-SCHEDULE][STATUS] 🏠 Room ID: {}", roomId);

            // 5. STOMP 전송 경로
            String dest = "/topic/room/" + roomId + "/ai-schedule/status";
            log.info("[AI-SCHEDULE][STATUS] 🚀 Sending to STOMP Destination: {}", dest);

            // 6. 메시지 전송
            stomp.convertAndSend(dest, m);
            log.info("[AI-SCHEDULE][STATUS] 🎯 STOMP Message Sent Successfully");

        } catch (Exception e) {
            log.warn("[AI-SCHEDULE][STATUS] ❌ onMessage error: {}", e.getMessage(), e);
        }
    }

    public String channel() {
        return RedisChannelType.AI_SCHEDULE_STATUS.getChannel();
    }}