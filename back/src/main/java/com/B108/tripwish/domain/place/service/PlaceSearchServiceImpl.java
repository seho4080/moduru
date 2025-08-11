package com.B108.tripwish.domain.place.service;

import java.util.*;
import java.util.stream.Collectors;

import com.B108.tripwish.domain.place.dto.response.AiRecommendResponse;
import com.B108.tripwish.global.common.entity.Region;
import com.B108.tripwish.global.exception.CustomException;
import com.B108.tripwish.global.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Qualifier;
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
import org.springframework.http.HttpStatusCode;
import reactor.core.publisher.Mono;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlaceSearchServiceImpl implements PlaceSearchService {

  private final PlaceSearchRepository placeSearchRepository;
  private final PlaceRepository placeRepository;
  private final MyPlaceReaderService myPlaceReaderService;
  private final WantPlaceReaderService wantPlaceReaderService;
  private final RoomService roomService;

  @Qualifier("aiWebClient")
  private final WebClient aiWebClient;  // NOTE: WebClient로 주입받기

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

  @Override
  @Transactional(readOnly = true)
  public PlaceListResponseDto searchPlacesByAI(CustomUserDetails user, Long roomId, PlaceSearchRequest request) {
    Region region = roomService.getRegionByRoomId(roomId);

    AiRecommendResponse aiRes = aiWebClient.post()
            .uri("/recommend/places")
            .bodyValue(Map.of(
                    "region_id", region.getId(),
                    "query", request.getKeyword()
            ))
            .retrieve()
            .onStatus(HttpStatusCode::is4xxClientError, r -> r.bodyToMono(String.class)
                    .then(Mono.error(new CustomException(ErrorCode.BAD_REQUEST))))
            .onStatus(HttpStatusCode::is5xxServerError, r -> r.bodyToMono(String.class)
                    .then(Mono.error(new CustomException(ErrorCode.AI_SERVER_ERROR))))
            .bodyToMono(AiRecommendResponse.class)
            .block();

    List<Long> ids = (aiRes == null || aiRes.result() == null) ? List.of() : aiRes.result();
    if (ids.isEmpty()) return new PlaceListResponseDto(List.of());

    Map<Long,Integer> order = new HashMap<>();
    for (int i=0;i<ids.size();i++) order.put(ids.get(i), i);

    List<Place> places = placeRepository.findAllById(ids).stream()
            .filter(p -> Objects.equals(p.getRegion().getId(), region.getId()))
            .sorted(Comparator.comparingInt(p -> order.getOrDefault(p.getId(), Integer.MAX_VALUE)))
            .toList();

    Long userId = user.getUser().getId();
    List<Long> placeIds = places.stream().map(Place::getId).toList();

    Set<Long> liked = myPlaceReaderService.getMyPlaceIds(userId, placeIds);
    Set<Long> wanted = wantPlaceReaderService.getWantPlaceIds(roomId, placeIds, PlaceType.PLACE);

    var dtoList = places.stream()
            .map(p -> PlaceResponseDto.fromEntity(
                    p,
                    liked.contains(p.getId()),
                    wanted.contains(p.getId())
            ))
            .toList();

    return new PlaceListResponseDto(dtoList);
  }


}
