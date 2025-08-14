package com.B108.tripwish.websocket.dto.request;

import java.time.LocalTime;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@Builder
public class EventRequestDto {
  private Long wantId;
  private Integer eventOrder;
  private LocalTime endTime;
}
