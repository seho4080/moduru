package com.B108.tripwish.websocket.dto.request;

import lombok.*;

import java.time.LocalTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@Builder
public class EventRequestDto {
    private Long wantId;
    private Integer order;
    private LocalTime endTime;
}
