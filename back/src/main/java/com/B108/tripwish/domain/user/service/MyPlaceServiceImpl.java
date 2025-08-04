package com.B108.tripwish.domain.user.service;

import com.B108.tripwish.domain.user.repository.MyPlaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class MyPlaceServiceImpl implements MyPlaceService{

    private final MyPlaceRepository myPlaceRepository;

    @Override
    public boolean isLiked(Long userId, Long placeId) {
        return myPlaceRepository.existsById_UserIdAndId_PlaceId(userId, placeId);
    }
}
