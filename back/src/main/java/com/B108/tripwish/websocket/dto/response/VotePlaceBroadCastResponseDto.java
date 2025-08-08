package com.B108.tripwish.websocket.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@Getter
@Builder
@AllArgsConstructor
@ToString
public class VotePlaceBroadCastResponseDto {
    private Long wantId;
    private int voteCnt;
    private String senderId;
}
