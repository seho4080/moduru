package com.B108.tripwish.domain.place.service;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.place.dto.response.PlaceDto;
import com.B108.tripwish.domain.place.dto.response.PlaceListResponseDto;
import com.B108.tripwish.domain.place.entity.Place;

public interface PlaceService {
    PlaceListResponseDto getPlaces(CustomUserDetails user, Long roomId, String category);

    PlaceDto buildPlaceDto(Place place, Long userId, Long roomId);
}
