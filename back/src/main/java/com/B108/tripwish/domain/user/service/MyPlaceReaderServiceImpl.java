package com.B108.tripwish.domain.user.service;

import java.util.Collection;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.B108.tripwish.domain.user.repository.MyPlaceRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MyPlaceReaderServiceImpl implements MyPlaceReaderService {
  private final MyPlaceRepository myPlaceRepository;

  @Override
  public boolean isLiked(Long userId, Long placeId) {
    return myPlaceRepository.existsById_UserIdAndId_PlaceId(userId, placeId);
  }

  @Override
  public Set<Long> getMyPlaceIds(Long userId, Collection<Long> placeIds) {
    return myPlaceRepository.findMyPlaceIds(userId, placeIds);
  }
}
