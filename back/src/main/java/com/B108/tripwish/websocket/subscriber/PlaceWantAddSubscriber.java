package com.B108.tripwish.websocket.subscriber;

import com.B108.tripwish.websocket.dto.response.PlaceWantAddMessageResponseDto;
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
public class PlaceWantAddSubscriber implements MessageListener {
    private final ObjectMapper objectMapper;
    private final SimpMessageSendingOperations messagingTemplate;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            PlaceWantAddMessageResponseDto dto =
                    objectMapper.readValue(message.getBody(), PlaceWantAddMessageResponseDto.class);

            messagingTemplate.convertAndSend(
                    "/topic/room/" + dto.getRoomId() + "/place-want/add",
                    dto
            );

        } catch (Exception e) {
            log.error("[Redis 희망장소 추가 메시지 처리 에러]", e);
        }
    }
}