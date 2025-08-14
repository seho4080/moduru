package com.B108.tripwish.websocket.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@Getter
@Builder
@AllArgsConstructor
@ToString
public class VotePlacePersonalResponseDto {
  private Long roomId;
  private Long wantId;
  private boolean isVoted;
  private String receiverId;
}
