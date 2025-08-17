package com.B108.tripwish.domain.schedule.service;

import com.B108.tripwish.domain.schedule.dto.request.AiScheduleRequestDto;
import com.B108.tripwish.domain.schedule.dto.response.AiSnapshotResponseDto;

public interface AiScheduleService {
  String enqueue(Long roomId, AiScheduleRequestDto req);

  AiSnapshotResponseDto getRoomSnapshot(Long roomId);
}
