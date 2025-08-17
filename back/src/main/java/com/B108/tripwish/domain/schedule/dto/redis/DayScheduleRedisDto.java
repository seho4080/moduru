package com.B108.tripwish.domain.schedule.dto.redis;

import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DayScheduleRedisDto {
  private LocalDate date;
  private List<DraftEventDto> events;
  private int version;
}
