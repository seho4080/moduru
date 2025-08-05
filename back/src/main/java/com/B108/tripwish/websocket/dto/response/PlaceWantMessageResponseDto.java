package com.B108.tripwish.websocket.dto.response;

import lombok.*;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class PlaceWantMessageResponseDto {
  private String type; // 메시지 타입: pin:add, pin:remove
  private String roomId; // 여행방 ID
  private String id; // 핀 ID
  private Double lat; // 위도 (add일 때만)
  private Double lng; // 경도 (add일 때만)
}
