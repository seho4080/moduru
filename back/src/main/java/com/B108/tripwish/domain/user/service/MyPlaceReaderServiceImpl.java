package com.B108.tripwish.domain.user.service;

import com.B108.tripwish.domain.user.repository.MyPlaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MyPlaceReaderServiceImpl implements MyPlaceReaderService {
    private final MyPlaceRepository myPlaceRepository;

    @Override
    public boolean isLiked(Long userId, Long placeId) {
        return myPlaceRepository.existsById_UserIdAndId_PlaceId(userId, placeId);
    }
}