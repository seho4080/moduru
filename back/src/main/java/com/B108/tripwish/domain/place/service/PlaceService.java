package com.B108.tripwish.domain.place.service;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.place.dto.response.PlaceBucketsResponseDto;
import com.B108.tripwish.domain.place.dto.response.PlaceDetailResponseDto;
import com.B108.tripwish.domain.place.dto.response.PlaceListResponseDto;

public interface PlaceService {
  PlaceListResponseDto getPlaces(CustomUserDetails user, Long roomId, String category);

  PlaceDetailResponseDto getPlaceDetail(CustomUserDetails user, Long roomId, Long placeId);
}
