package com.B108.tripwish.domain.route.service;

import com.B108.tripwish.domain.route.dto.request.AiRouteRequestDto;
import com.B108.tripwish.domain.route.dto.response.AiRouteSnapshotResponseDto;

public interface AiRouteService {
  String enqueue(Long roomId, AiRouteRequestDto spec);

  AiRouteSnapshotResponseDto getRouteSnapshot(Long roomId);
}
