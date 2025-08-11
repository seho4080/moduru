package com.B108.tripwish.websocket.subscriber;

import com.B108.tripwish.websocket.dto.response.VotePlaceBroadCastResponseDto;
import com.B108.tripwish.websocket.dto.response.VotePlaceMessage;
import com.B108.tripwish.websocket.dto.response.VotePlacePersonalResponseDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@RequiredArgsConstructor
@Component
public class VotePlaceSubscriber implements MessageListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            String rawMessage = new String(message.getBody());
            VotePlaceMessage parsed = objectMapper.readValue(rawMessage, VotePlaceMessage.class);

            // 1. 전체 방에 브로드캐스트
            messagingTemplate.convertAndSend(
                    "/topic/room/" + parsed.getRoomId() + "/place-vote",
                    new VotePlaceBroadCastResponseDto(parsed.getWantId(), parsed.getVoteCnt(), parsed.getSenderId())
            );

            // 2. 특정 사용자에게 개인 메시지
            messagingTemplate.convertAndSendToUser(
                    parsed.getReceiverId(),
                    "/queue/place-vote",
                    new VotePlacePersonalResponseDto(parsed.getRoomId(), parsed.getWantId(), parsed.isVoted(), parsed.getReceiverId())
            );

        } catch (Exception e) {
            log.error("❌ [VotePlaceSubscriber] Redis 메시지 처리 실패", e);
        }
    }
}