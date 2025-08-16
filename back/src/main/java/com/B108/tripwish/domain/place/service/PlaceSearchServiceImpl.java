package com.B108.tripwish.domain.place.service;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.place.document.PlaceDocument;
import com.B108.tripwish.domain.place.dto.ai.AiPlaceResult;
import com.B108.tripwish.domain.place.dto.ai.AiPlaceSpec;
import com.B108.tripwish.domain.place.dto.request.AiPlaceRequestDto;
import com.B108.tripwish.domain.place.dto.request.PlaceSearchRequest;
import com.B108.tripwish.domain.place.dto.response.PlaceListResponseDto;
import com.B108.tripwish.domain.place.dto.response.PlaceResponseDto;
import com.B108.tripwish.domain.place.entity.Place;
import com.B108.tripwish.domain.place.repository.PlaceRepository;
import com.B108.tripwish.domain.place.repository.PlaceSearchRepository;
import com.B108.tripwish.domain.room.service.RoomService;
import com.B108.tripwish.domain.room.service.WantPlaceReaderService;
import com.B108.tripwish.domain.user.service.MyPlaceReaderService;
import com.B108.tripwish.global.common.entity.Region;
import com.B108.tripwish.global.common.enums.PlaceType;
import com.B108.tripwish.global.exception.CustomException;
import com.B108.tripwish.global.exception.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;

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
  private final PlaceAiGateWay ai;
  private final ObjectMapper objectMapper;

  @Transactional(readOnly = true)
  @Override
  public PlaceListResponseDto searchPlaces(
      CustomUserDetails user, Long roomId, PlaceSearchRequest request) {

    String keyword = request.getKeyword();
    Region region = roomService.getRegionByRoomId(roomId);

    // 지역 기반 필터링
    Set<Long> regionPlaceIds =
        placeRepository.findAllByRegionId_Id(region.getId()).stream()
            .map(Place::getId)
            .collect(Collectors.toSet());

    // 키워드 기반 전체 검색
    List<PlaceDocument> documents =
        placeSearchRepository.findByPlaceNameContainingOrAddressContainingOrCategoryNameContaining(
            keyword, keyword, keyword);

    // 모든 placeId 추출
    List<Long> placeIds = documents.stream().map(doc -> Long.parseLong(doc.getId())).toList();

    // liked/wanted placeId 한 번에 가져오기
    Set<Long> likedPlaceIds = myPlaceReaderService.getMyPlaceIds(user.getUser().getId(), placeIds);
    Set<Long> wantedPlaceIds =
        wantPlaceReaderService.getWantPlaceIds(roomId, placeIds, PlaceType.PLACE);

    // DTO 매핑 함수 개선된 버전 사용
    List<PlaceResponseDto> regionMatched =
        documents.stream()
            .filter(doc -> regionPlaceIds.contains(Long.parseLong(doc.getId())))
            .map(doc -> mapToResponseDto(doc, likedPlaceIds, wantedPlaceIds))
            .toList();

    List<PlaceResponseDto> others =
        documents.stream()
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
      PlaceDocument doc, Set<Long> likedPlaceIds, Set<Long> wantedPlaceIds) {
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
  public PlaceListResponseDto searchPlacesByAI(
      CustomUserDetails user, Long roomId, AiPlaceRequestDto request) {

    Region region = roomService.getRegionByRoomId(roomId);
    if (region == null || region.getId() == null) {
      log.warn("[AI place] region missing: roomId={} region={}", roomId, region);
      throw new CustomException(ErrorCode.REGION_NOT_FOUND);
    }
    Long regionId = region.getId();
    log.info(
        "[AI place] roomId={} regionId={} keyword='{}'",
        roomId,
        regionId,
        request != null ? request.getKeyword() : null);

    // 1) AI 호출 사양
    AiPlaceSpec spec =
        AiPlaceSpec.builder().regionId(regionId).query(request.getKeyword().trim()).build();

    try {
      String reqJson = objectMapper.writeValueAsString(spec);
      log.info("[AI req] {}", reqJson);
    } catch (Exception e) {
      log.warn("[AI req] JSON 직렬화 실패", e);
    }

    // 2) AI 호출 + 결과 정규화
    AiPlaceResult result = ai.recommendPlace(spec);
    if (result == null || result.getResult() == null || result.getResult().isEmpty()) {
      log.warn("[AI place] result is null");
      throw new CustomException(ErrorCode.AI_BAD_RESPONSE);
    }

    try {
      log.info("[AI parsed] {}", objectMapper.writeValueAsString(result));
    } catch (Exception ignore) {
      log.info("[AI parsed] result.result={}", result.getResult());
    }

    // 문자열/리스트 모두 수용
    List<Long> aiIds = normalizeIds(result.getResult());
    if (aiIds.isEmpty()) {
      throw new CustomException(ErrorCode.AI_BAD_RESPONSE);
    }

    // 3) DB 조회 (N+1 방지: 이미지 + 카테고리 fetch-join)
    // 3-1. ID 수가 많을 수 있으면 청크 처리(선택)
    List<Place> found = new ArrayList<>();
    final int CHUNK = 800; // 드라이버/DB 환경에 맞게 조절
    for (int i = 0; i < aiIds.size(); i += CHUNK) {
      List<Long> sub = aiIds.subList(i, Math.min(i + CHUNK, aiIds.size()));
      found.addAll(placeRepository.findAllWithImagesAndCategoryByIdIn(sub));
    }

    // 3-2. id -> Place 맵 구성
    Map<Long, Place> byId =
        found.stream().collect(Collectors.toMap(Place::getId, p -> p, (a, b) -> a));

    // 4) AI 순서 유지 + 중복 제거 + 존재하는 것만 필터
    List<Long> orderedExistingIds =
        new LinkedHashSet<>(aiIds).stream().filter(byId::containsKey).toList();

    if (orderedExistingIds.isEmpty()) {
      throw new CustomException(ErrorCode.PLACE_NOT_FOUND);
    }

    // 5) liked/wanted 배치 조회
    Set<Long> likedPlaceIds =
        myPlaceReaderService.getMyPlaceIds(user.getUser().getId(), orderedExistingIds);
    Set<Long> wantedPlaceIds =
        wantPlaceReaderService.getWantPlaceIds(roomId, orderedExistingIds, PlaceType.PLACE);

    // 6) DTO 매핑 (fromEntity 사용 → 이미지/카테고리 접근 안전)
    List<PlaceResponseDto> places = new ArrayList<>(orderedExistingIds.size());
    for (Long id : orderedExistingIds) {
      Place p = byId.get(id);
      places.add(
          PlaceResponseDto.fromEntity(p, likedPlaceIds.contains(id), wantedPlaceIds.contains(id)));
    }

    return new PlaceListResponseDto(places);
  }

  /** "result"가 List<Long>이든 "[1,2,3]" 문자열이든 Long 리스트로 정규화 */
  private List<Long> normalizeIds(Object raw) {
    if (raw instanceof List<?> list) {
      return list.stream()
          .map(
              o -> {
                if (o == null) return null;
                if (o instanceof Number n) return n.longValue();
                try {
                  return Long.parseLong(o.toString().trim());
                } catch (Exception e) {
                  return null;
                }
              })
          .filter(Objects::nonNull)
          .collect(Collectors.toCollection(LinkedHashSet::new)) // 순서 유지 + 중복 제거
          .stream()
          .toList();
    }

    String s = String.valueOf(raw);
    if (s == null || s.isBlank()) return List.of();
    s = s.trim();
    if (s.startsWith("[") && s.endsWith("]")) s = s.substring(1, s.length() - 1);
    if (s.isBlank()) return List.of();

    String[] tokens = s.split(",");
    List<Long> out = new ArrayList<>(tokens.length);
    Set<Long> seen = new HashSet<>();
    for (String t : tokens) {
      String token = t.trim();
      if (token.isEmpty()) continue;
      try {
        Long id = Long.parseLong(token);
        if (seen.add(id)) out.add(id);
      } catch (NumberFormatException ignore) {
      }
    }
    return out;
  }
}
