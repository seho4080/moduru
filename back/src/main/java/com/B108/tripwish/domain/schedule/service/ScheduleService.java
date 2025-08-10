package com.B108.tripwish.domain.schedule.service;

import java.util.List;

import com.B108.tripwish.domain.schedule.dto.response.ScheduleListResponseDto;

public interface ScheduleService {
  List<ScheduleListResponseDto> getSchedules(Long roomId);
}
