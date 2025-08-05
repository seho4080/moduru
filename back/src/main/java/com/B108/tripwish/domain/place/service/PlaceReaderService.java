package com.B108.tripwish.domain.place.service;

import com.B108.tripwish.domain.place.dto.PlaceInfoDto;
import com.B108.tripwish.domain.place.entity.Place;

public interface PlaceReaderService {
  Place findPlaceById(Long placeId);

  // ID 기반 DTO 반환 (리뷰 도메인 전용)
  PlaceInfoDto getPlaceInfo(Long placeId);
}
