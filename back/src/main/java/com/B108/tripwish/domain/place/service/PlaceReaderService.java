package com.B108.tripwish.domain.place.service;

import com.B108.tripwish.domain.place.dto.PlaceInfoDto;
import com.B108.tripwish.domain.place.entity.Place;
import com.B108.tripwish.domain.user.dto.response.MyPlaceInfoResponse;

public interface PlaceReaderService {

  // Place 엔티티를 ID 기반으로 조회
  Place findPlaceById(Long placeId);

  // 존재 여부만 검증
  void validatePlaceExists(Long placeId);

  // ID 기반으로 PlaceInfoDto를 반환 (MyPlace, 리뷰 도메인 등에서 활용)
  PlaceInfoDto getPlaceInfo(Long placeId);

  // user 도메인 전용 DTO 반환
  MyPlaceInfoResponse getMyPlaceInfo(Long placeId);

    Place getReference(Long placeId);
}
