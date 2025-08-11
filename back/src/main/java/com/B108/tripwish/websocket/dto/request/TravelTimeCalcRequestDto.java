package com.B108.tripwish.websocket.dto.request;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDate;
import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class TravelTimeCalcRequestDto {
    private Long roomId;
    private int day; // 일차
    private LocalDate date;
    private List<EventRequestDto> events; // 순서와 장소 ID
}
