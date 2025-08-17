package com.B108.tripwish.domain.schedule.dto.redis;

import java.time.LocalTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DraftEventDto {
  private Long wantId;
  private LocalTime startTime;
  private LocalTime endTime;
  private int eventOrder;
  private Integer nextTravelTime; // 있어도 되고 없어도 됨
}
