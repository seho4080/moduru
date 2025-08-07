package com.B108.tripwish.domain.user.service;

import java.util.List;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.user.dto.response.MyPlaceInfoResponse;

public interface MyPlaceService {
  void toggleLikePlace(CustomUserDetails user, Long placeId);

  List<MyPlaceInfoResponse> getLikedPlaces(CustomUserDetails user);
}
