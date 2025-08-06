package com.B108.tripwish.websocket.subscriber;

import com.B108.tripwish.websocket.dto.response.PlaceWantRemoveMessageResponseDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PlaceWantRemoveSubscriber implements MessageListener {

    private final ObjectMapper objectMapper;
    private final SimpMessageSendingOperations messagingTemplate;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            PlaceWantRemoveMessageResponseDto dto =
                    objectMapper.readValue(message.getBody(), PlaceWantRemoveMessageResponseDto.class);

            messagingTemplate.convertAndSend(
                    "/topic/room/" + dto.getRoomId() + "/place-want/remove",
                    dto
            );

        } catch (Exception e) {
            log.error("[Redis 희망장소 제거 메시지 처리 에러]", e);
        }
    }
}

