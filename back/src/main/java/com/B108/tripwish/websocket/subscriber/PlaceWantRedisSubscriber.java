package com.B108.tripwish.websocket.subscriber;

import com.B108.tripwish.websocket.dto.response.PlaceWantMessageResponseDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PlaceWantRedisSubscriber implements MessageListener {

    private final ObjectMapper objectMapper;
    private final SimpMessageSendingOperations messagingTemplate;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            String raw = new String(message.getBody());
            PlaceWantMessageResponseDto responseDto = objectMapper.readValue(raw, PlaceWantMessageResponseDto.class);
            String topic = new String(message.getChannel());
            messagingTemplate.convertAndSend(topic, responseDto);
        } catch (Exception e) {
            log.error("[희망장소 메시지 처리 에러]", e);
        }
    }
}
