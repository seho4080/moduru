package com.B108.tripwish.domain.user.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.place.service.PlaceReaderService;
import com.B108.tripwish.domain.user.dto.response.MyPlaceInfoResponse;
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
  public List<MyPlaceInfoResponse> getLikedPlaces(CustomUserDetails userDetails) {
    Long userId = userDetails.getUser().getId();

    return myPlaceRepository.findByUser_Id(userId).stream()
        .map(mp -> placeReaderService.getMyPlaceInfo(mp.getPlaceId()))
        .collect(Collectors.toList());
  }
}
