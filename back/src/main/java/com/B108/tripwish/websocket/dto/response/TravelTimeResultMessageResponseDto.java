package com.B108.tripwish.websocket.dto.response;

import java.util.List;

import lombok.*;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TravelTimeResultMessageResponseDto {
  private Long roomId;
  private Integer day;
  private String transport;
  private long totalDistanceMeters;
  private long totalDurationMinutes; // ✅ 분 단위
  private List<LegResponseDto> legs;
}
