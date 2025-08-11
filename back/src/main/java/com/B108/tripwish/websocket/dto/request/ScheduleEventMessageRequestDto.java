package com.B108.tripwish.websocket.dto.request;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class ScheduleEventMessageRequestDto {

  private Long wantId;

  @JsonFormat(pattern = "HH:mm")
  private LocalDate startTime;

  @JsonFormat(pattern = "HH:mm")
  private LocalDate endTime;

  private int eventOrder;
}
