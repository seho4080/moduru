package com.B108.tripwish.domain.review.service;

import java.util.List;

public interface ReviewService {
  List<String> getTagNamesByPlaceId(Long placeId);
}
