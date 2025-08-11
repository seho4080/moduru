package com.B108.tripwish.websocket.dto.request;

import java.time.LocalDate;
import java.util.List;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class ScheduleMessageRequestDto {
  private Long roomId;
  private int day;
  private LocalDate date;
  private List<ScheduleEventMessageRequestDto> events;

}
