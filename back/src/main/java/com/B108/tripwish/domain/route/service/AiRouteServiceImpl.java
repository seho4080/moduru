package com.B108.tripwish.domain.route.service;

import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.B108.tripwish.domain.room.entity.WantPlace;
import com.B108.tripwish.domain.room.repository.WantPlaceRepository;
import com.B108.tripwish.domain.route.dto.ai.AiRouteResult;
import com.B108.tripwish.domain.route.dto.ai.AiRouteSpec;
import com.B108.tripwish.domain.route.dto.request.AiRouteRequestDto;
import com.B108.tripwish.domain.route.dto.response.AiRouteSnapshotResponseDto;
import com.B108.tripwish.domain.route.websocket.AiRoutePublisher;
import com.B108.tripwish.global.exception.CustomException;
import com.B108.tripwish.global.exception.ErrorCode;
import com.B108.tripwish.global.lock.RoomLockService;
import com.B108.tripwish.global.util.PlaceInfo;
import com.B108.tripwish.global.util.PlaceInfoResolver;
import com.B108.tripwish.websocket.dto.response.AiRecommendBroadcastDto;
import com.B108.tripwish.websocket.service.AiTaskType;
import com.B108.tripwish.websocket.service.RedisAiService;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiRouteServiceImpl implements AiRouteService {

  private final RouteAiGateway ai; // HttpGateway 구현 주입
  private final WantPlaceRepository wantPlaceRepository;
  private final PlaceInfoResolver placeInfoResolver;
  private final AiRoutePublisher publisher; // WS 브로드캐스트
  private final RoomLockService roomLockService;
  private final RedisAiService redisAiService;
  private final ObjectMapper objectMapper;

  @Override
  public String enqueue(Long roomId, AiRouteRequestDto spec) {
    if (spec == null
        || spec.getPlaceList() == null
        || spec.getPlaceList().size() < 2
        || spec.getDay() < 1) {
      throw new CustomException(ErrorCode.BAD_REQUEST);
    }
    String jobId = UUID.randomUUID().toString();
    runAsync(roomId, jobId, spec);
    return jobId;
  }

  /** 비동기 AI 실행 */
  @Async("travelTaskExecutor")
  protected void runAsync(Long roomId, String jobId, AiRouteRequestDto req) {
    try {
      publisher.started(roomId, jobId, req.getDay());

      // 프론트 DTO -> AI Spec
      AiRouteSpec spec = buildSpec(roomId, req);

      // AI 서버 호출
      AiRouteResult result = ai.recommendRoute(spec);

      if (result == null || result.getRoute() == null || result.getRoute().isEmpty()) {
        throw new CustomException(ErrorCode.AI_BAD_RESPONSE);
      }

      log.info("[AI-ROUTE] ▶ result roomId={} day={}", roomId, result.getDay());

      // AI 반환 ID 검증 + 메타 로드
      List<Long> aiWantIds =
          result.getRoute().stream()
              .map(AiRouteResult.RouteInfo::getId)
              .filter(Objects::nonNull)
              .distinct()
              .toList();

      List<WantPlace> loaded =
          aiWantIds.isEmpty() ? List.of() : wantPlaceRepository.findAllById(aiWantIds);

      if (loaded.stream().anyMatch(wp -> !Objects.equals(wp.getTravelRoom().getId(), roomId))) {
        throw new CustomException(ErrorCode.ROOM_FORBIDDEN);
      }

      placeInfoResolver.preload(loaded);
      Map<Long, WantPlace> wantById =
          loaded.stream().collect(Collectors.toMap(WantPlace::getId, Function.identity()));

      // WS로 보낼 데이터 조립
      AiRecommendBroadcastDto payload = buildPreviewPayload(roomId, result, wantById);

      publisher.done(roomId, jobId, payload);

    } catch (Exception e) {
      log.warn("[AI-ROUTE] roomId={} jobId={} failed: {}", roomId, jobId, e.getMessage(), e);
      publisher.error(roomId, jobId, e.getMessage());
    } finally {
      roomLockService.releaseRouteLock(roomId, req.getDay());
    }
  }

  /** DB 검증 + Spec 재구성 */
  @Transactional(Transactional.TxType.SUPPORTS)
  protected AiRouteSpec buildSpec(Long roomId, AiRouteRequestDto req) {
    // 1) 원본 순서 유지 + 중복 제거
    List<Long> wantIds = req.getPlaceList().stream().filter(Objects::nonNull).distinct().toList();

    // 만약 placeList가 List<AiRouteRequestDto.AiPlaceInfoDto> 라면 ↑ 대신 아래 한 줄:
    // List<Long> wantIds =
    // req.getPlaceList().stream().map(AiRouteRequestDto.AiPlaceInfoDto::getId).filter(Objects::nonNull).distinct().toList();

    if (wantIds.size() < 2) {
      throw new CustomException(ErrorCode.BAD_REQUEST); // 최소 2개 이상 필요
    }

    // 2) 존재/소속 검증
    List<WantPlace> places = wantPlaceRepository.findAllById(wantIds);
    if (places.size() != wantIds.size()) {
      throw new CustomException(ErrorCode.WANT_PLACE_NOT_FOUND);
    }
    if (places.stream().anyMatch(wp -> !Objects.equals(wp.getTravelRoom().getId(), roomId))) {
      throw new CustomException(ErrorCode.ROOM_FORBIDDEN);
    }

    // 3) 메타 미리 로드
    placeInfoResolver.preload(places);
    Map<Long, WantPlace> byId =
        places.stream().collect(Collectors.toMap(WantPlace::getId, Function.identity()));

    // 4) AI Spec 변환 (camelCase: categoryId/lat/lng)
    List<AiRouteSpec.AiPlaceInfoDto> aiPlaces = new ArrayList<>(wantIds.size());
    for (Long id : wantIds) {
      WantPlace wp = byId.get(id);
      PlaceInfo info = placeInfoResolver.getPlaceInfo(wp);

      aiPlaces.add(
          AiRouteSpec.AiPlaceInfoDto.builder()
              .id(id)
              .categoryId(info != null ? info.getCategoryId() : null)
              .lat(info != null ? info.getLat() : null)
              .lng(info != null ? info.getLng() : null)
              .build());
    }

    return AiRouteSpec.builder()
        .placeList(aiPlaces) // JSON 변환 시 snake_case 전략이면 place_list로 내려감
        .days(req.getDay()) // 단일 작업이면 1
        .build();
  }

  /** 브로드캐스트용 변환 — AiRoute는 단일 Day/Transport */
  private AiRecommendBroadcastDto buildPreviewPayload(
      Long roomId, AiRouteResult result, Map<Long, WantPlace> wantById) {
    List<AiRecommendBroadcastDto.RouteDto> legs =
        result.getRoute().stream()
            .sorted(Comparator.comparing(r -> Optional.ofNullable(r.getEventOrder()).orElse(0)))
            .map(
                r -> {
                  WantPlace wp = wantById.get(r.getId());
                  PlaceInfo info = (wp != null) ? placeInfoResolver.getPlaceInfo(wp) : null;

                  return AiRecommendBroadcastDto.RouteDto.builder()
                      .wantId(r.getId())
                      .placeImg(info != null ? info.getImageUrl() : null)
                      .placeName(info != null ? info.getName() : null)
                      .transport(r.getTransport())
                      .eventOrder(Optional.ofNullable(r.getEventOrder()).orElse(0))
                      .lat(info != null ? info.getLat() : null)
                      .lng(info != null ? info.getLng() : null)
                      .nextTravelTime(
                          Optional.ofNullable(r.getNextTravelTime())
                              .map(sec -> (int) Math.ceil(sec / 60.0))
                              .orElse(null))
                      .build();
                })
            .toList();

    return AiRecommendBroadcastDto.builder()
        .roomId(roomId)
        .schedule(
            List.of( // 단일 day만 포함
                AiRecommendBroadcastDto.ScheduleInfo.builder()
                    .day(result.getDay())
                    .legs(legs)
                    .build()))
        .build();
  }

  @Override
  public AiRouteSnapshotResponseDto getRouteSnapshot(Long roomId) {
    var statusJsonOpt = redisAiService.getRoomStatus(AiTaskType.ROUTE, roomId);
    if (statusJsonOpt.isEmpty()) {
      return AiRouteSnapshotResponseDto.builder()
          .roomId(roomId)
          .status("IDLE")
          .updatedAt(Instant.now())
          .build();
    }

    Map<String, Object> statusMap = parseJson(statusJsonOpt.get());
    String type = str(statusMap.get("type"));
    String jobId = str(statusMap.get("jobId"));
    Integer progress = asInt(statusMap.get("progress"));
    String message = str(statusMap.get("message"));
    String reason = str(statusMap.get("reason"));
    Instant updatedAt = asInstant(statusMap.get("updatedAt"));

    var builder =
        AiRouteSnapshotResponseDto.builder()
            .roomId(roomId)
            .status(type)
            .jobId(jobId)
            .progress(progress)
            .message(message)
            .reason(reason)
            .updatedAt(updatedAt);

    if ("DONE".equals(type)) {
      redisAiService
          .getRoomResult(AiTaskType.ROUTE, roomId)
          .ifPresent(json -> builder.result(parseJson(json)));
    }
    return builder.build();
  }

  /** Redis에 저장되어 있는 JSON 문자열을 안전하게 꺼내고, DTO에 맞는 타입으로 변환하기 위한 헬퍼 메서드 */
  @SuppressWarnings("unchecked")
  private Map<String, Object> parseJson(String json) {
    try {
      return objectMapper.readValue(json, Map.class);
    } catch (Exception e) {
      return Map.of(
          "type",
          "ERROR",
          "message",
          "snapshot-parse-failed",
          "updatedAt",
          Instant.now().toString());
    }
  }

  private String str(Object o) {
    return (o == null) ? null : String.valueOf(o);
  }

  private Integer asInt(Object o) {
    if (o == null) return null;
    if (o instanceof Number n) return n.intValue();
    try {
      return Integer.parseInt(o.toString());
    } catch (Exception e) {
      return null;
    }
  }

  private Instant asInstant(Object o) {
    if (o == null) return Instant.now();
    try {
      return Instant.parse(o.toString());
    } catch (Exception e) {
      return Instant.now();
    }
  }
}
