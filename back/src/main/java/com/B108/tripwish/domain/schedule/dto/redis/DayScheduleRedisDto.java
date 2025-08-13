package com.B108.tripwish.domain.schedule.dto.redis;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DayScheduleRedisDto {
    private LocalDate date;
    private List<DraftEventDto> events;
    private int version;
}
