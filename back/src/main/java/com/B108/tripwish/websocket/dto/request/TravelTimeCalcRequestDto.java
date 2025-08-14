package com.B108.tripwish.websocket.dto.request;

import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class TravelTimeCalcRequestDto {
  private Long roomId;
  private int day; // 일차
  private LocalDate date;
  private String transport;
  private List<EventRequestDto> events; // 순서와 장소 ID
}
