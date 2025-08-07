package com.B108.tripwish.domain.place.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.B108.tripwish.domain.place.dto.PlaceInfoDto;
import com.B108.tripwish.domain.place.entity.Place;
import com.B108.tripwish.domain.place.repository.PlaceRepository;
import com.B108.tripwish.domain.user.dto.response.MyPlaceInfoResponse;
import com.B108.tripwish.global.exception.CustomException;
import com.B108.tripwish.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PlaceReaderServiceImpl implements PlaceReaderService {

  private final PlaceRepository placeRepository;

  @Override
  @Transactional(readOnly = true)
  public Place findPlaceById(Long placeId) {
    return placeRepository
        .findWithImagesById(placeId)
        .orElseThrow(() -> new CustomException(ErrorCode.PLACE_NOT_FOUND));
  }

  @Override
  @Transactional(readOnly = true)
  public void validatePlaceExists(Long placeId) {
    if (!placeRepository.existsById(placeId)) {
      throw new CustomException(ErrorCode.PLACE_NOT_FOUND);
    }
  }

  @Override
  @Transactional(readOnly = true)
  public PlaceInfoDto getPlaceInfo(Long placeId) {
    Place place = findPlaceById(placeId);
    return new PlaceInfoDto(place.getId(), place.getPlaceName());
  }

  @Override
  @Transactional(readOnly = true)
  public MyPlaceInfoResponse getMyPlaceInfo(Long placeId) {
    Place place = findPlaceById(placeId);
    return new MyPlaceInfoResponse(place.getId(), place.getPlaceName());
  }
}
