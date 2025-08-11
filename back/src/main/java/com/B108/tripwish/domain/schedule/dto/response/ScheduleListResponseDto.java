package com.B108.tripwish.domain.schedule.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleListResponseDto {
    private int day;
    private LocalDate date;
    private List<ScheduleEventResponseDto> events;
}
