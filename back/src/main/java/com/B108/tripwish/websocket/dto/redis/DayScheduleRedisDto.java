package com.B108.tripwish.websocket.dto.redis;

import java.time.LocalDate;
import java.util.List;

import com.B108.tripwish.websocket.dto.request.ScheduleEventMessageRequestDto;

import lombok.*;

@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DayScheduleRedisDto {
  private LocalDate date;
  private List<ScheduleEventMessageRequestDto> events;
}
