package com.B108.tripwish.domain.schedule.service;

import java.util.List;

import com.B108.tripwish.domain.schedule.dto.ai.AiScheduleResult;
import com.B108.tripwish.domain.schedule.dto.ai.AiScheduleSpec;

public interface ScheduleAiGateway {
  List<AiScheduleResult> recommendSchedule(AiScheduleSpec spec);
}
