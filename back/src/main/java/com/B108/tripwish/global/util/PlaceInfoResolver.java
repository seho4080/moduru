package com.B108.tripwish.global.util;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.B108.tripwish.domain.place.entity.Place;
import com.B108.tripwish.domain.place.repository.PlaceRepository;
import com.B108.tripwish.domain.room.entity.CustomPlace;
import com.B108.tripwish.domain.room.entity.WantPlace;
import com.B108.tripwish.domain.room.repository.CustomPlaceRepository;
import com.B108.tripwish.global.common.enums.PlaceType;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class PlaceInfoResolver {

  private final PlaceRepository placeRepository;
  private final CustomPlaceRepository customPlaceRepository;

  private Map<Long, Place> placeMap = new HashMap<>();
  private Map<Long, CustomPlace> customMap = new HashMap<>();

  // Step 1: 미리 로드해서 캐싱
  public void preload(List<WantPlace> wantPlaces) {
    // places 테이블의 id들
    Set<Long> placeIds =
        wantPlaces.stream()
            .filter(wp -> wp.getType() == PlaceType.PLACE)
            .map(WantPlace::getRefId)
            .collect(Collectors.toSet());

    // custom_places 테이블의 id들
    Set<Long> customIds =
        wantPlaces.stream()
            .filter(wp -> wp.getType() == PlaceType.CUSTOM)
            .map(WantPlace::getRefId)
            .collect(Collectors.toSet());

    placeMap =
        placeRepository.findAllWithImagesByIdIn(placeIds).stream()
            .collect(Collectors.toMap(Place::getId, Function.identity()));

    customMap =
        customPlaceRepository.findAllById(customIds).stream()
            .collect(Collectors.toMap(CustomPlace::getId, Function.identity()));
  }

    // WantPlace → PlaceInfo로 변환
    public PlaceInfo getPlaceInfo(WantPlace wp) {
        if (wp.getType() == PlaceType.PLACE) {
            Place place = placeMap.get(wp.getRefId());
            if (place == null) return null;

            return PlaceInfo.builder()
                    .name(place.getPlaceName())
                    .imageUrl(!place.getImages().isEmpty() ? place.getImages().get(0).getImgUrl() : null)
                    .address(place.getRoadAddressName())
                    .categoryId(place.getCategoryId().getId())
                    .category(place.getCategoryId().getCategoryName())
                    .lat(place.getLat())
                    .lng(place.getLng())
                    .build();

        } else if (wp.getType() == PlaceType.CUSTOM) {
            CustomPlace custom = customMap.get(wp.getRefId());
            if (custom == null) return null;

            return PlaceInfo.builder()
                    .name(custom.getName())
                    .imageUrl(null)
                    .address(custom.getAddress())
                    .categoryId(0L)
                    .category(null)
                    .lat(custom.getLat())
                    .lng(custom.getLng())
                    .build();
        }

        return null;
    }

}
