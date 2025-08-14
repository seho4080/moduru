package com.B108.tripwish.domain.schedule.dto.request;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleCommitRequestDto {
  private Map<Integer, Integer> versions; // day: draftVersion
}
