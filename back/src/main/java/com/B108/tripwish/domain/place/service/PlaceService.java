package com.B108.tripwish.domain.place.service;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.place.dto.response.PlaceBucketsResponseDto;
import com.B108.tripwish.domain.place.dto.response.PlaceDetailResponseDto;
import com.B108.tripwish.domain.place.dto.response.PlaceListResponseDto;


public interface PlaceService {
  PlaceListResponseDto getPlaces(CustomUserDetails user, Long roomId, String category);

  PlaceDetailResponseDto getPlaceDetail(CustomUserDetails user, Long roomId, Long placeId);

  // 카테고리별 + MyPlaces를 한 번에 반환
  PlaceBucketsResponseDto getPlacesBuckets(CustomUserDetails user, Long roomId);

}
