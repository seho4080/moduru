package com.B108.tripwish.websocket.service;

import org.springframework.stereotype.Service;

import com.B108.tripwish.websocket.dto.response.VotePlaceMessage;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VotePlaceSocketService {

  private final RedisPublisher redisPublisher;

  public void sendVoteResult(Long roomId, Long wantPlaceId, int voteCnt, String senderId) {
    VotePlaceMessage message =
        VotePlaceMessage.builder()
            .roomId(roomId)
            .wantId(wantPlaceId)
            .voteCnt(voteCnt)
            .senderId(senderId)
            .build();

    redisPublisher.publish(RedisChannelType.PLACE_VOTE, message);
  }
}
