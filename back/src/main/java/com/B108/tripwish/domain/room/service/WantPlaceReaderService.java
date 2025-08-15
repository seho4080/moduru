package com.B108.tripwish.domain.room.service;

import java.util.Collection;
import java.util.Set;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.room.dto.response.PlaceWantListResponseDto;
import com.B108.tripwish.domain.room.entity.CustomPlace;
import com.B108.tripwish.domain.room.entity.WantPlace;
import com.B108.tripwish.global.common.enums.PlaceType;

public interface WantPlaceReaderService {

  boolean isWanted(Long roomId, Long placeId, PlaceType type);

  boolean isVotedByUser(Long userId, Long wantPlaceId);

  long getVoteCount(Long wantPlaceId, WantPlace wantPlace);

  CustomPlace getCustomPlaceById(Long id);

  PlaceWantListResponseDto getWantList(CustomUserDetails user, Long roomId);

  Set<Long> getWantPlaceIds(Long roomId, Collection<Long> placeIds, PlaceType type);
}
