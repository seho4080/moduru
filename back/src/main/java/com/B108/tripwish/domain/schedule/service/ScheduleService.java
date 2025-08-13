package com.B108.tripwish.domain.schedule.service;

import com.B108.tripwish.domain.schedule.dto.request.ScheduleCommitRequestDto;
import com.B108.tripwish.domain.schedule.dto.response.ScheduleConflictResponseDto;
import com.B108.tripwish.domain.schedule.dto.response.ScheduleListResponseDto;

import java.util.List;

public interface ScheduleService {
    List<ScheduleListResponseDto> getSchedules(Long roomId);

    void commitSchedule(Long roomId, ScheduleCommitRequestDto request);

    ScheduleConflictResponseDto handleVersionConflict(Long roomId);
}
