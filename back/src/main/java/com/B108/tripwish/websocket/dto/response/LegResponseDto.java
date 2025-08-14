package com.B108.tripwish.websocket.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LegResponseDto {
  private long fromWantId;
  private long toWantId;
  private long distanceMeters;
  private long durationMinutes; // ✅ 분 단위
  private String transport;
}
