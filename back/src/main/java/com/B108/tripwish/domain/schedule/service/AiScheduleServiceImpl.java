package com.B108.tripwish.domain.schedule.service;

import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.B108.tripwish.domain.room.entity.WantPlace;
import com.B108.tripwish.domain.room.repository.WantPlaceRepository;
import com.B108.tripwish.domain.schedule.dto.ai.AiScheduleResult;
import com.B108.tripwish.domain.schedule.dto.ai.AiScheduleSpec;
import com.B108.tripwish.domain.schedule.dto.request.AiScheduleRequestDto;
import com.B108.tripwish.domain.schedule.dto.response.AiSnapshotResponseDto;
import com.B108.tripwish.domain.schedule.websocket.AiSchedulePublisher;
import com.B108.tripwish.global.exception.CustomException;
import com.B108.tripwish.global.exception.ErrorCode;
import com.B108.tripwish.global.lock.RoomLockService;
import com.B108.tripwish.global.util.PlaceInfo;
import com.B108.tripwish.global.util.PlaceInfoResolver;
import com.B108.tripwish.websocket.dto.response.AiRecommendBroadcastDto;
import com.B108.tripwish.websocket.service.RedisAiService;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiScheduleServiceImpl implements AiScheduleService {

  private final ScheduleAiGateway ai; // infra의 HttpAiGateway 구현이 주입됨
  private final WantPlaceRepository wantPlaceRepository; // 보강/검증
  private final PlaceInfoResolver placeInfoResolver; // lat/lng 등 메타 로드
  private final AiSchedulePublisher publisher; // WS 브로드캐스트(STARTED/DONE/ERROR)
  private final RoomLockService roomLockService; // 방 락 해제 보장
  private final RedisAiService redisAiService;
  private final ObjectMapper objectMapper;
  private final com.fasterxml.jackson.databind.ObjectMapper om;

  @Override
  public String enqueue(Long roomId, AiScheduleRequestDto req) {
    if (req == null
        || req.getPlaceList() == null
        || req.getPlaceList().size() < 2
        || req.getDays() < 1) {
      throw new CustomException(ErrorCode.BAD_REQUEST);
    }
    String jobId = UUID.randomUUID().toString();
    runAsync(roomId, jobId, req); // 비동기 실행
    return jobId;
  }

  /** 실제 실행 — 지정된 TaskExecutor에서 비동기로 수행 */
  @Async("travelTaskExecutor")
  protected void runAsync(Long roomId, String jobId, AiScheduleRequestDto req) {
    try {
      // STARTED 이벤트(프론트 로딩 표시용)
      publisher.started(roomId, jobId, req.getDays());

      // 프론트 DTO -> AI Spec (roomId는 Spec에 포함되지 않음)
      AiScheduleSpec spec = buildSpec(roomId, req);

      // 🔎 요약 로그 (info)
      int placeCnt = spec.getPlaceList() == null ? 0 : spec.getPlaceList().size();
      var ids =
          spec.getPlaceList() == null
              ? List.<Long>of()
              : spec.getPlaceList().stream().map(AiScheduleSpec.AiPlaceInfoDto::getId).toList();
      log.info(
          "[🔎AI-SCHEDULE] ▶ Spec summary roomId={} days={} places={} ids={}",
          roomId,
          spec.getDays(),
          placeCnt,
          ids);

      // 🔎 상세 로그 (INFO로 강제 출력)
      try {
        // 1) 예쁘게 JSON (snake_case로 직렬화됨)
        String pretty = om.writerWithDefaultPrettyPrinter().writeValueAsString(spec);
        log.info("[🔎AI-SCHEDULE] ▶ Spec(JSON pretty)\n{}", pretty);
      } catch (Exception je) {
        log.warn("[🔎AI-SCHEDULE] ▶ Spec JSON serialize error: {}", je.getMessage(), je);
      }

      // AI 호출
      List<AiScheduleResult> result = ai.recommendSchedule(spec);

      if (result == null || result.isEmpty()) {
        throw new CustomException(ErrorCode.AI_BAD_RESPONSE);
      }

      // 2) AI가 반환한 wantId 전부 수집해 메타(이름/이미지/좌표) 로드
      List<Long> aiWantIds =
          result.stream()
              .flatMap(d -> Optional.ofNullable(d.getRoute()).orElseGet(List::of).stream())
              .map(AiScheduleResult.RouteInfo::getId)
              .filter(Objects::nonNull)
              .distinct()
              .toList();

      List<WantPlace> loaded =
          aiWantIds.isEmpty() ? List.of() : wantPlaceRepository.findAllById(aiWantIds);

      // 같은 방 소속/존재 검증(방어)
      if (loaded.stream().anyMatch(wp -> !Objects.equals(wp.getTravelRoom().getId(), roomId))) {
        throw new CustomException(ErrorCode.ROOM_FORBIDDEN);
      }

      placeInfoResolver.preload(loaded); // N+1 방지
      Map<Long, WantPlace> wantById =
          loaded.stream().collect(Collectors.toMap(WantPlace::getId, w -> w));

      // 3) 프론트로 보낼 페이로드 조립
      AiRecommendBroadcastDto payload = buildPreviewPayload(roomId, result, wantById);

      // DONE 이벤트(프론트 프리뷰 렌더용)
      publisher.done(roomId, jobId, payload);

    } catch (Exception e) {
      log.warn("[AI-SCHEDULE] roomId={} jobId={} failed: {}", roomId, jobId, e.getMessage(), e);
      publisher.error(roomId, jobId, e.getMessage());
    } finally {
      // 락 해제 보장
      roomLockService.releaseScheduleLock(roomId);
    }
  }

  /** 프론트 요청을 AI Spec으로 변환 (검증/보강 포함) — roomId는 내부 검증에만 사용 */
  @Transactional(Transactional.TxType.SUPPORTS)
  protected AiScheduleSpec buildSpec(Long roomId, AiScheduleRequestDto req) {
    // 1) 원본 순서 유지 + 중복 제거
    List<Long> wantIds = req.getPlaceList().stream().distinct().toList();

    // 2) 존재/소속 검증
    List<WantPlace> places = wantPlaceRepository.findAllById(wantIds);
    if (places.size() != wantIds.size()) {
      throw new CustomException(ErrorCode.WANT_PLACE_NOT_FOUND);
    }
    if (places.stream().anyMatch(wp -> !Objects.equals(wp.getTravelRoom().getId(), roomId))) {
      throw new CustomException(ErrorCode.ROOM_FORBIDDEN);
    }

    // 3) 좌표/이름 등 메타 미리 로드 (N+1 방지)
    placeInfoResolver.preload(places);
    Map<Long, WantPlace> byId =
        places.stream().collect(Collectors.toMap(WantPlace::getId, Function.identity()));

    // 4) AI가 기대하는 placeList로 변환 (Spec에는 roomId 없음)
    List<AiScheduleSpec.AiPlaceInfoDto> aiPlaces = new ArrayList<>(wantIds.size());
    for (Long id : wantIds) {
      WantPlace wp = byId.get(id);
      PlaceInfo info = placeInfoResolver.getPlaceInfo(wp);

      aiPlaces.add(
          AiScheduleSpec.AiPlaceInfoDto.builder()
              .id(id) // ← Spec 정의에 맞춰 'id' 사용
              .categoryId(info != null ? info.getCategoryId() : null) // 필요 시 보강(없으면 제거)
              .lat(info != null ? info.getLat() : null)
              .lng(info != null ? info.getLng() : null)
              .build());
    }

    return AiScheduleSpec.builder()
        .placeList(aiPlaces) // JSON: place_list (snake_case)
        .days(req.getDays())
        .build();
  }

  private AiRecommendBroadcastDto buildPreviewPayload(
      Long roomId, List<AiScheduleResult> ai, Map<Long, WantPlace> wantById) {
    List<AiRecommendBroadcastDto.ScheduleInfo> schedule =
        ai.stream()
            .sorted(Comparator.comparingInt(AiScheduleResult::getDay))
            .map(
                day -> {
                  List<AiRecommendBroadcastDto.RouteDto> legs =
                      Optional.ofNullable(day.getRoute()).orElseGet(List::of).stream()
                          .sorted(
                              Comparator.comparing(
                                  r -> Optional.ofNullable(r.getEventOrder()).orElse(0)))
                          .map(
                              r -> {
                                WantPlace wp = wantById.get(r.getId());
                                PlaceInfo info =
                                    (wp != null) ? placeInfoResolver.getPlaceInfo(wp) : null;

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
                                            .orElse(null)) // Integer 그대로
                                    .build();
                              })
                          .toList();

                  return AiRecommendBroadcastDto.ScheduleInfo.builder()
                      .day(day.getDay())
                      .legs(legs)
                      .build();
                })
            .toList();

    return AiRecommendBroadcastDto.builder().roomId(roomId).schedule(schedule).build();
  }

  @Override
  public AiSnapshotResponseDto getRoomSnapshot(Long roomId) {

    // 1) Redis에서 상태 조회
    Optional<String> statusJsonOpt = redisAiService.getRoomStatus(roomId);
    if (statusJsonOpt.isEmpty()) {
      // 아무 상태도 없으면 IDLE
      return AiSnapshotResponseDto.builder()
          .roomId(roomId)
          .status("IDLE")
          .updatedAt(Instant.now())
          .build();
    }

    // 2) JSON → Map 변환
    Map<String, Object> statusMap = parseJson(statusJsonOpt.get());

    // 기본 필드
    String type = str(statusMap.get("type"));
    String jobId = str(statusMap.get("jobId"));
    Integer progress = asInt(statusMap.get("progress"));
    String message = str(statusMap.get("message"));
    String reason = str(statusMap.get("reason"));
    Instant updatedAt = asInstant(statusMap.get("updatedAt"));

    // 3) 응답 DTO 빌더 생성
    AiSnapshotResponseDto.AiSnapshotResponseDtoBuilder builder =
        AiSnapshotResponseDto.builder()
            .roomId(roomId)
            .status(type)
            .jobId(jobId)
            .progress(progress)
            .message(message)
            .reason(reason)
            .updatedAt(updatedAt);

    // 4) DONE 상태면 결과도 붙이기
    if ("DONE".equals(type)) {
      redisAiService
          .getRoomResult(roomId)
          .ifPresent(
              resultJson -> {
                builder.result(parseJson(resultJson));
              });
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
