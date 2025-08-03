package com.B108.tripwish.domain.room.service;

import com.B108.tripwish.domain.room.repository.WantPlaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class WantPlaceServiceImpl implements WantPlaceService{

    private final WantPlaceRepository wantPlaceRepository;
    @Override
    public boolean isWanted(Long roomId, Long placeId) {
        return wantPlaceRepository.existsByTravelRoom_IdAndPlace_Id(roomId, placeId);
    }
}
