package com.B108.tripwish.domain.route.dto.response;

import com.B108.tripwish.domain.schedule.entity.TransportType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LegResponseDto {
  private long fromWantId; // 출발 WantPlace ID
  private long toWantId; // 도착 WantPlace ID
  private long distanceMeters; // 거리
  private long durationSec; // 시간(초)
  private TransportType transport; // 이동 수단
}
