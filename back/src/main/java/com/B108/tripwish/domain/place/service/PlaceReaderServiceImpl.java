package com.B108.tripwish.domain.place.service;

import com.B108.tripwish.domain.place.entity.Place;
import com.B108.tripwish.domain.place.respoistory.PlaceRepository;
import com.B108.tripwish.global.exception.CustomException;
import com.B108.tripwish.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PlaceReaderServiceImpl implements PlaceReaderService {

    private final PlaceRepository placeRepository;

    @Override
    public Place findPlaceById(Long placeId) {
        return placeRepository.findById(placeId)
                .orElseThrow(() -> new CustomException(ErrorCode.PLACE_NOT_FOUND));
    }
}
