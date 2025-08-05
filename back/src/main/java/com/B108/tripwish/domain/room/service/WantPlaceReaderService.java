package com.B108.tripwish.domain.room.service;

import com.B108.tripwish.domain.room.entity.WantPlace;

public interface WantPlaceReaderService {

    boolean isWanted(Long roomId, Long placeId);

    boolean isVotedByUser(Long userId, Long wantPlaceId);

    long getVoteCount(Long wantPlaceId, WantPlace wantPlace);

}
