package com.B108.tripwish.domain.room.service;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.room.entity.WantPlace;
import com.B108.tripwish.global.common.enums.PlaceType;

public interface WantPlaceService {
  void toggleVotePlace(CustomUserDetails user, Long wantId);

  WantPlace saveWantPlace(Long roomId, PlaceType type, Long refId);

  void removeWantPlace(Long roomId, Long wantId);
}
