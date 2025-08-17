package com.B108.tripwish.websocket.subscriber;

import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import com.B108.tripwish.websocket.dto.response.VotePlaceBroadCastResponseDto;
import com.B108.tripwish.websocket.dto.response.VotePlaceMessage;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

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

      // 1. 전체 방에 브로드캐스트 (voteCnt만)
      String broadcastDest = "/topic/room/" + parsed.getRoomId() + "/place-vote";
      VotePlaceBroadCastResponseDto broadcastMsg =
          new VotePlaceBroadCastResponseDto(
              parsed.getWantId(), parsed.getVoteCnt(), parsed.getSenderId());

      log.info("📤 [VotePlaceSubscriber] 브로드캐스트 전송: {} -> {}", broadcastDest, broadcastMsg);
      messagingTemplate.convertAndSend(broadcastDest, broadcastMsg);

      // 개인 메시지 제거 - API 응답에서 isVoted 상태를 반환하므로 불필요

      log.info("✅ [VotePlaceSubscriber] 메시지 처리 완료");
    } catch (Exception e) {
      log.error("❌ [VotePlaceSubscriber] Redis 메시지 처리 실패", e);
    }
  }
}
