package com.B108.tripwish.domain.schedule.service;

import com.B108.tripwish.domain.schedule.dto.ai.AiScheduleResult;
import com.B108.tripwish.domain.schedule.dto.ai.AiScheduleSpec;

import java.util.List;

public interface ScheduleAiGateway {
    List<AiScheduleResult> recommendSchedule(AiScheduleSpec spec);
}
