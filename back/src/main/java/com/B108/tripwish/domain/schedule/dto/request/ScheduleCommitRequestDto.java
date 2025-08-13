package com.B108.tripwish.domain.schedule.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleCommitRequestDto {
    private Map<Integer, Integer> versions; // day: draftVersion
}
