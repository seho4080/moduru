package com.B108.tripwish.websocket.service;

import com.B108.tripwish.websocket.dto.response.VotePlaceBroadCastResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class VotePlaceSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public void sendVoteResult(Long roomId, Long wantPlaceId, int voteCnt, String receiverId) {
        VotePlaceBroadCastResponseDto message = new VotePlaceBroadCastResponseDto(wantPlaceId, voteCnt, receiverId);
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/place-vote", message);
    }
}