package com.B108.tripwish.domain.room.service;

import com.B108.tripwish.domain.room.entity.VotePlaceId;
import com.B108.tripwish.domain.room.entity.WantPlace;
import com.B108.tripwish.domain.room.repository.VotePlaceRepository;
import com.B108.tripwish.domain.room.repository.WantPlaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
@Slf4j
public class WantPlaceReaderServiceImpl implements WantPlaceReaderService{
    private final WantPlaceRepository wantPlaceRepository;
    private final VotePlaceRepository votePlaceRepository;

    @Override
    public boolean isWanted(Long roomId, Long placeId) {
        return wantPlaceRepository.existsByTravelRoom_IdAndPlace_Id(roomId, placeId);
    }

    @Override
    public boolean isVotedByUser(Long userId, Long wantPlaceId) {
        VotePlaceId id = new VotePlaceId(wantPlaceId, userId);
        return votePlaceRepository.existsByIdAndVoteIsTrue(id);
    }

    @Override
    public long getVoteCount(Long wantPlaceId, WantPlace wantPlace) {
        return votePlaceRepository.countByWantPlaceAndVoteIsTrue(wantPlace);
    }
}
