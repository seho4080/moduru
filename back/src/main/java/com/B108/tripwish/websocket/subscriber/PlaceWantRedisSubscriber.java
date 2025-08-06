package com.B108.tripwish.websocket.subscriber;

import com.B108.tripwish.websocket.dto.response.PlaceWantAddMessageResponseDto;
import com.B108.tripwish.websocket.dto.response.PlaceWantMessage;
import com.B108.tripwish.websocket.dto.response.PlaceWantRemoveMessageResponseDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Component;

import java.util.UUID;

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
            JsonNode jsonNode = objectMapper.readTree(raw);

            String action = jsonNode.get("action").asText(); // "add" or "remove"
            UUID targetUser =  UUID.fromString(jsonNode.get("userUUID").asText());

            PlaceWantMessage responseDto;

            if ("add".equals(action)) {
                responseDto = objectMapper.treeToValue(jsonNode, PlaceWantAddMessageResponseDto.class);
            } else if ("remove".equals(action)) {
                responseDto = objectMapper.treeToValue(jsonNode, PlaceWantRemoveMessageResponseDto.class);
            } else {
                log.warn("[PlaceWantRedisSubscriber] 알 수 없는 action: {}", action);
                return;
            }

            messagingTemplate.convertAndSendToUser(targetUser.toString(), "/queue/place-want", responseDto);
        } catch (Exception e) {
            log.error("[Redis 희망장소 메시지 처리 에러]", e);
        }
    }
}
