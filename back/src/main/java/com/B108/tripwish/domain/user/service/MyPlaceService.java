package com.B108.tripwish.domain.user.service;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.user.dto.response.MyPlaceInfoResponse;

import java.util.List;

public interface MyPlaceService {
    void toggleLikePlace(CustomUserDetails user, Long placeId);
    List<MyPlaceInfoResponse> getLikedPlaces(CustomUserDetails user);
}
