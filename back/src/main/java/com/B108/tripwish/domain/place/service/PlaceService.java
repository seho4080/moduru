package com.B108.tripwish.domain.place.service;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.place.dto.response.PlaceDetailResponseDto;
import com.B108.tripwish.domain.place.dto.response.PlaceListResponseDto;
import com.B108.tripwish.domain.place.dto.response.PlaceResponseDto;
import com.B108.tripwish.domain.place.entity.Place;

public interface PlaceService {
  PlaceListResponseDto getPlaces(CustomUserDetails user, Long roomId, String category);

  PlaceDetailResponseDto getPlaceDetail(CustomUserDetails user, Long roomId, Long placeId);
}
