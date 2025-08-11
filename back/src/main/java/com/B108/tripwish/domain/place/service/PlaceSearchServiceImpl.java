package com.B108.tripwish.domain.place.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import com.B108.tripwish.global.common.entity.Region;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.place.document.PlaceDocument;
import com.B108.tripwish.domain.place.dto.request.PlaceSearchRequest;
import com.B108.tripwish.domain.place.dto.response.PlaceListResponseDto;
import com.B108.tripwish.domain.place.dto.response.PlaceResponseDto;
import com.B108.tripwish.domain.place.entity.Place;
import com.B108.tripwish.domain.place.repository.PlaceRepository;
import com.B108.tripwish.domain.place.repository.PlaceSearchRepository;
import com.B108.tripwish.domain.room.service.RoomService;
import com.B108.tripwish.domain.room.service.WantPlaceReaderService;
import com.B108.tripwish.domain.user.service.MyPlaceReaderService;
import com.B108.tripwish.global.common.enums.PlaceType;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlaceSearchServiceImpl implements PlaceSearchService {

  private final PlaceSearchRepository placeSearchRepository;
  private final PlaceRepository placeRepository;
  private final MyPlaceReaderService myPlaceReaderService;
  private final WantPlaceReaderService wantPlaceReaderService;
  private final RoomService roomService;

  @Transactional(readOnly = true)
  @Override
  public PlaceListResponseDto searchPlaces(
          CustomUserDetails user, Long roomId, PlaceSearchRequest request) {

    String keyword = request.getKeyword();
    Region region = roomService.getRegionByRoomId(roomId);

    // 지역 기반 필터링
    Set<Long> regionPlaceIds =
            placeRepository.findAllByRegion_Id(region.getId()).stream()
                    .map(Place::getId)
                    .collect(Collectors.toSet());

    // 키워드 기반 전체 검색
    List<PlaceDocument> documents =
            placeSearchRepository.findByPlaceNameContainingOrAddressContainingOrCategoryNameContaining(
                    keyword, keyword, keyword);

    // 모든 placeId 추출
    List<Long> placeIds = documents.stream()
            .map(doc -> Long.parseLong(doc.getId()))
            .toList();

    // liked/wanted placeId 한 번에 가져오기
    Set<Long> likedPlaceIds = myPlaceReaderService.getMyPlaceIds(user.getUser().getId(), placeIds);
    Set<Long> wantedPlaceIds = wantPlaceReaderService.getWantPlaceIds(roomId, placeIds, PlaceType.PLACE);

    // DTO 매핑 함수 개선된 버전 사용
    List<PlaceResponseDto> regionMatched = documents.stream()
            .filter(doc -> regionPlaceIds.contains(Long.parseLong(doc.getId())))
            .map(doc -> mapToResponseDto(doc, likedPlaceIds, wantedPlaceIds))
            .toList();

    List<PlaceResponseDto> others = documents.stream()
            .filter(doc -> !regionPlaceIds.contains(Long.parseLong(doc.getId())))
            .map(doc -> mapToResponseDto(doc, likedPlaceIds, wantedPlaceIds))
            .toList();

    // 합치기: 지역 우선 → 기타
    List<PlaceResponseDto> response = new ArrayList<>();
    response.addAll(regionMatched);
    response.addAll(others);

    return new PlaceListResponseDto(response);
  }


  private PlaceResponseDto mapToResponseDto(
          PlaceDocument doc,
          Set<Long> likedPlaceIds,
          Set<Long> wantedPlaceIds
  ) {
    Long placeId = Long.parseLong(doc.getId());

    return PlaceResponseDto.builder()
            .placeId(placeId)
            .placeName(doc.getPlaceName())
            .placeImg(doc.getImageUrl())
            .category(doc.getCategoryName())
            .address(doc.getAddress())
            .latitude(doc.getLat())
            .longitude(doc.getLng())
            .isLiked(likedPlaceIds.contains(placeId))
            .isWanted(wantedPlaceIds.contains(placeId))
            .build();
  }
}
