package com.B108.tripwish.domain.user.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.place.dto.response.PlaceResponseDto;
import com.B108.tripwish.domain.place.entity.Place;
import com.B108.tripwish.domain.place.repository.PlaceRepository;
import com.B108.tripwish.domain.place.service.PlaceReaderService;
import com.B108.tripwish.domain.user.entity.MyPlace;
import com.B108.tripwish.domain.user.entity.MyPlaceId;
import com.B108.tripwish.domain.user.entity.User;
import com.B108.tripwish.domain.user.repository.MyPlaceRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class MyPlaceServiceImpl implements MyPlaceService {

  private final MyPlaceRepository myPlaceRepository;
  private final PlaceReaderService placeReaderService;
  private final PlaceRepository placeRepository;

  @Override
  @Transactional
  public void toggleLikePlace(CustomUserDetails userDetails, Long placeId) {
    User user = userDetails.getUser();

    placeReaderService.validatePlaceExists(placeId);

    MyPlaceId id = new MyPlaceId(user.getId(), placeId);

    if (myPlaceRepository.existsById(id)) {
      myPlaceRepository.deleteById(id);
    } else {
      MyPlace myPlace = MyPlace.builder().id(id).user(user).placeId(placeId).build();
      myPlaceRepository.save(myPlace);
    }
  }

  @Override
  @Transactional(readOnly = true)
  public List<PlaceResponseDto> getLikedPlaces(CustomUserDetails userDetails, Long regionId) {
    Long userId = userDetails.getUser().getId();

    List<Place> places;

    if (regionId != null) {
      places = placeRepository.findAllLikedByUserIdAndRegion(userId, regionId);
    } else {
      places = placeRepository.findAllLikedByUserIdWithDetail(userId);
    }

    // 좋아요 목록이므로 isLiked=true, isWanted는 필요 없으면 false
    return places.stream().map(p -> PlaceResponseDto.fromEntity(p, true, false)).toList();
  }
}
