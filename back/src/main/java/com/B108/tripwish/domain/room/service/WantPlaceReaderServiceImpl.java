package com.B108.tripwish.domain.room.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.place.entity.Place;
import com.B108.tripwish.domain.place.service.PlaceReaderService;
import com.B108.tripwish.domain.room.dto.response.PlaceWantDto;
import com.B108.tripwish.domain.room.dto.response.PlaceWantListResponseDto;
import com.B108.tripwish.domain.room.dto.response.PlaceWantMetaDto;
import com.B108.tripwish.domain.room.entity.CustomPlace;
import com.B108.tripwish.domain.room.entity.VotePlaceId;
import com.B108.tripwish.domain.room.entity.WantPlace;
import com.B108.tripwish.domain.room.repository.CustomPlaceRepository;
import com.B108.tripwish.domain.room.repository.VotePlaceRepository;
import com.B108.tripwish.domain.room.repository.WantPlaceRepository;
import com.B108.tripwish.domain.user.service.MyPlaceReaderService;
import com.B108.tripwish.global.common.enums.PlaceType;
import com.B108.tripwish.global.exception.CustomException;
import com.B108.tripwish.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class WantPlaceReaderServiceImpl implements WantPlaceReaderService {

  private final WantPlaceRepository wantPlaceRepository;
  private final VotePlaceRepository votePlaceRepository;
  private final CustomPlaceRepository customPlaceRepository;
  private final MyPlaceReaderService myPlaceReaderService;
  private final PlaceReaderService placeReaderService;

  @Override
  public boolean isWanted(Long roomId, Long placeId, PlaceType type) {
    return wantPlaceRepository.existsByTravelRoom_IdAndRefIdAndType(roomId, placeId, type);
  }

  @Override
  public boolean isVotedByUser(Long userId, Long wantPlaceId) {
    VotePlaceId id = new VotePlaceId(wantPlaceId, userId);
    return votePlaceRepository.existsByIdAndVoteIsTrue(id);
  }

  @Override
  public long getVoteCount(Long wantPlaceId, WantPlace wantPlace) {
    return votePlaceRepository.countByWantPlaceAndVoteIsTrue(wantPlace);
  }

  @Override
  public CustomPlace getCustomPlaceById(Long id) {
    CustomPlace customPlace =
        customPlaceRepository
            .findById(id)
            .orElseThrow(() -> new CustomException(ErrorCode.CUSTOM_PLACE_NOT_FOUND));
    return customPlace;
  }

  @Override
  public PlaceWantListResponseDto getWantList(CustomUserDetails user, Long roomId) {
    List<WantPlace> wants = wantPlaceRepository.findAllByTravelRoom_Id(roomId);
    Long userId = user.getUser().getId();

    List<PlaceWantDto> result = new ArrayList<>();

    for (WantPlace want : wants) {
      Long refId = want.getRefId();
      PlaceType type = want.getType();

      PlaceWantMetaDto meta;
      if (type == PlaceType.PLACE) {
        Place place = placeReaderService.findPlaceById(refId);
        meta =
            PlaceWantMetaDto.builder()
                .placeName(place.getPlaceName())
                .placeImg(
                    !place.getImages().isEmpty() ? place.getImages().get(0).getImgUrl() : null)
                .address(place.getRoadAddressName())
                .category(place.getCategory().getCategoryName())
                .lat(place.getLat())
                .lng(place.getLng())
                .isLiked(myPlaceReaderService.isLiked(userId, place.getId()))
                .build();
      } else if (type == PlaceType.CUSTOM) {
        CustomPlace custom =
            customPlaceRepository
                .findById(refId)
                .orElseThrow(() -> new CustomException(ErrorCode.CUSTOM_PLACE_NOT_FOUND));
        meta =
            PlaceWantMetaDto.builder()
                .placeName(custom.getName())
                .placeImg(null)
                .address(custom.getAddress())
                .category(null)
                .lat(custom.getLat())
                .lng(custom.getLng())
                .isLiked(null)
                .build();
      } else {
        throw new CustomException(ErrorCode.UNSUPPORTED_PLACE_TYPE);
      }
      // 추가 정보 계산
      boolean isVoted = votePlaceRepository.existsById(new VotePlaceId(want.getId(), userId));
      Long voteCnt = votePlaceRepository.countByWantPlaceAndVoteIsTrue(want);

      // PlaceWantDto로 통합
      PlaceWantDto dto =
          PlaceWantDto.builder()
              .wantId(want.getId())
              .type(type)
              .refId(refId)
              .placeName(meta.getPlaceName())
              .placeImg(meta.getPlaceImg())
              .category(meta.getCategory())
              .address(meta.getAddress())
              .lat(meta.getLat())
              .lng(meta.getLng())
              .isLiked(meta.getIsLiked())
              .isVoted(isVoted)
              .voteCnt(voteCnt)
              .build();

      result.add(dto);
    }

    return PlaceWantListResponseDto.builder().placesWant(result).build();
  }
}
