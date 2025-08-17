package com.B108.tripwish.websocket.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VotePlaceMessage {
  private Long roomId; // 어떤 방에서
  private Long wantId; // 어떤 장소에 대한 투표인지
  private int voteCnt; // 총 투표 수
  private boolean voted; // 투표 여부 (true: 투표함, false: 투표 취소함)
  private String senderId;
  private String receiverId; // 메시지를 받아야 할 사용자 UUID (Principal.getName())
}
