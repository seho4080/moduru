package com.B108.tripwish.domain.schedule.dto.redis;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

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

