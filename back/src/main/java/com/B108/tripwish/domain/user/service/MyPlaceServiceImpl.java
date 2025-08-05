package com.B108.tripwish.domain.user.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.place.entity.Place;
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

  @Override
  @Transactional
  public void toggleLikePlace(CustomUserDetails userDetails, Long placeId) {
    User user = userDetails.getUser();

    // Place 객체 조회
    Place place = placeReaderService.findPlaceById(placeId);

    MyPlaceId id = new MyPlaceId(user.getId(), place.getId());

    boolean exists = myPlaceRepository.existsById(id);
    log.info(
        "🔍 [toggleLikePlace] 존재 여부 확인 - userId: {}, placeId: {}, exists: {}",
        user.getId(),
        place.getId(),
        exists);
    if (myPlaceRepository.existsById(id)) {
      log.info("🗑️ [toggleLikePlace] 삭제 시도 - id: {}", id);
      myPlaceRepository.deleteById(id);
    } else {
      log.info("💾 [toggleLikePlace] 저장 시도 - id: {}", id);
      MyPlace myPlace = MyPlace.builder().id(id).user(user).place(place).build();
      myPlaceRepository.save(myPlace);
    }
  }
}
