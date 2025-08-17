package com.B108.tripwish.infra.google.dto;

import java.time.Instant;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GoogleTransitRequest {
  private String origin; // "lat,lng"
  private String destination; // "lat,lng"
  private Instant departureTime;
  private boolean alternatives; // 옵션
  private String region; // "kr" 등
}
