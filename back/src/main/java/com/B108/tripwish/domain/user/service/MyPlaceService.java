package com.B108.tripwish.domain.user.service;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;

public interface MyPlaceService {

    void toggleLikePlace(CustomUserDetails user, Long placeId);
}
