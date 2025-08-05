package com.B108.tripwish.domain.place.service;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.place.dto.request.PlaceSearchRequest;
import com.B108.tripwish.domain.place.dto.response.PlaceListResponseDto;

public interface PlaceSearchService {

  PlaceListResponseDto searchPlaces(
      CustomUserDetails user, Long roomId, PlaceSearchRequest request);
}
