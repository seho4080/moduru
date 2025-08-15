package com.B108.tripwish.domain.place.service;

import com.B108.tripwish.domain.place.dto.ai.AiPlaceResult;
import com.B108.tripwish.domain.place.dto.ai.AiPlaceSpec;
import com.B108.tripwish.domain.schedule.dto.ai.AiScheduleResult;
import com.B108.tripwish.domain.schedule.dto.ai.AiScheduleSpec;

import java.util.List;

public interface PlaceAiGateWay {
    AiPlaceResult recommendPlace(AiPlaceSpec spec);
}
