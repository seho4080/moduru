package com.B108.tripwish.domain.place.service;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.place.dto.response.PlaceBucketsResponseDto;
import com.B108.tripwish.domain.place.dto.response.PlaceDetailResponseDto;
import com.B108.tripwish.domain.place.dto.response.PlaceListResponseDto;
import com.B108.tripwish.global.common.dto.RegionResponseDto;


public interface PlaceService {
  PlaceListResponseDto getPlaces(CustomUserDetails user, Long roomId, String category);

  PlaceDetailResponseDto getPlaceDetail(CustomUserDetails user, Long roomId, Long placeId);

  // 카테고리별 + MyPlaces를 한 번에 반환
  PlaceBucketsResponseDto getPlacesBuckets(CustomUserDetails user, Long roomId);

  // 지역 목록 조회(시·도 or 시·군)
  java.util.List<RegionResponseDto> getRegions(Long parentId);

}
