package com.B108.tripwish.domain.place.service;

import com.B108.tripwish.domain.place.entity.Place;

public interface PlaceReaderService {
  Place findPlaceById(Long placeId);
}
