package com.B108.tripwish.domain.room.service;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;

public interface WantPlaceService {
    void toggleVotePlace(CustomUserDetails user, Long wantId);

}
