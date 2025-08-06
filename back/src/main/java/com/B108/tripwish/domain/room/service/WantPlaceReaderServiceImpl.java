package com.B108.tripwish.domain.room.service;

import com.B108.tripwish.domain.room.entity.CustomPlace;
import com.B108.tripwish.domain.room.entity.VotePlaceId;
import com.B108.tripwish.domain.room.entity.WantPlace;
import com.B108.tripwish.domain.room.repository.CustomPlaceRepository;
import com.B108.tripwish.domain.room.repository.VotePlaceRepository;
import com.B108.tripwish.domain.room.repository.WantPlaceRepository;
import com.B108.tripwish.global.common.enums.PlaceType;
import com.B108.tripwish.global.exception.CustomException;
import com.B108.tripwish.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class WantPlaceReaderServiceImpl implements WantPlaceReaderService{
    private final WantPlaceRepository wantPlaceRepository;
    private final VotePlaceRepository votePlaceRepository;
    private final CustomPlaceRepository customPlaceRepository;

    @Override
    public boolean isWanted(Long roomId, Long placeId, PlaceType type) {
        return wantPlaceRepository.existsByTravelRoom_IdAndRefIdAndType(roomId, placeId, type);
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

    @Override
    public CustomPlace getCustomPlaceById(Long id) {
        CustomPlace customPlace = customPlaceRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.CUSTOM_PLACE_NOT_FOUND));
        return customPlace;
    }

}
