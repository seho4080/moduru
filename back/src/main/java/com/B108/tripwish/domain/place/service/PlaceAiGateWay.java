package com.B108.tripwish.domain.place.service;

import com.B108.tripwish.domain.place.dto.ai.AiPlaceResult;
import com.B108.tripwish.domain.place.dto.ai.AiPlaceSpec;

public interface PlaceAiGateWay {
  AiPlaceResult recommendPlace(AiPlaceSpec spec);
}
