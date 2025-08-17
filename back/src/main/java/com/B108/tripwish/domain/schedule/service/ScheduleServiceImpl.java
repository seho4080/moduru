package com.B108.tripwish.domain.schedule.service;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.B108.tripwish.domain.room.entity.WantPlace;
import com.B108.tripwish.domain.room.repository.WantPlaceRepository;
import com.B108.tripwish.domain.schedule.dto.request.ScheduleCommitRequestDto;
import com.B108.tripwish.domain.schedule.dto.response.ScheduleConflictResponseDto;
import com.B108.tripwish.domain.schedule.dto.response.ScheduleEventResponseDto;
import com.B108.tripwish.domain.schedule.dto.response.ScheduleListResponseDto;
import com.B108.tripwish.domain.schedule.dto.response.SchedulePlaceResponseDto;
import com.B108.tripwish.domain.schedule.entity.Schedule;
import com.B108.tripwish.domain.schedule.entity.ScheduleEvent;
import com.B108.tripwish.domain.schedule.repository.ScheduleEventRepository;
import com.B108.tripwish.domain.schedule.repository.ScheduleRepository;
import com.B108.tripwish.global.exception.CustomException;
import com.B108.tripwish.global.exception.ErrorCode;
import com.B108.tripwish.global.util.PlaceInfo;
import com.B108.tripwish.global.util.PlaceInfoResolver;
import com.B108.tripwish.websocket.dto.redis.DayScheduleRedisDto;
import com.B108.tripwish.websocket.service.RedisScheduleService;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduleServiceImpl implements ScheduleService {

  private final ScheduleRepository scheduleRepository;
  private final ScheduleEventRepository scheduleEventRepository;
  private final PlaceInfoResolver placeInfoResolver;
  private final RedisScheduleService redisScheduleService;
  private final WantPlaceRepository wantPlaceRepository;

  @Override
  public List<ScheduleListResponseDto> getSchedules(Long roomId) {
    // 1. roomId로 schedule 조회
    Schedule schedule =
        scheduleRepository
            .findByRoomId(roomId)
            .orElseThrow(() -> new CustomException(ErrorCode.SCHEDULE_NOT_FOUND));

    // 2. scheduleEvent + WantPlace fetch join 조회 (N+1 방지)
    List<ScheduleEvent> events =
        scheduleEventRepository.findAllBySchedulesIdWithWantPlace(schedule.getId());

    // 3. WantPlace 리스트 추출 → PlaceInfoResolver preload (쿼리 2회)
    List<WantPlace> wantPlaces = events.stream().map(ScheduleEvent::getWantPlace).toList();
    placeInfoResolver.preload(wantPlaces);

    // 4. day 기준 그룹핑
    Map<Integer, List<ScheduleEvent>> grouped =
        events.stream().collect(Collectors.groupingBy(ScheduleEvent::getDay));

    // 5. 그룹핑 → ScheduleListResponseDto 변환
    return grouped.entrySet().stream()
        .sorted(Map.Entry.comparingByKey()) // day 오름차순 정렬
        .map(
            entry -> {
              int day = entry.getKey();
              List<ScheduleEvent> dayEvents = entry.getValue();

              List<ScheduleEventResponseDto> eventDtos =
                  dayEvents.stream()
                      .sorted(Comparator.comparing(ScheduleEvent::getEventOrder))
                      .map(
                          event -> {
                            WantPlace wp = event.getWantPlace();
                            PlaceInfo info = placeInfoResolver.getPlaceInfo(wp);

                            return ScheduleEventResponseDto.builder()
                                .wantId(wp.getId())
                                .placeName(info != null ? info.getName() : null)
                                .placeImg(info != null ? info.getImageUrl() : null)
                                .lat(info != null ? info.getLat() : null)
                                .lng(info != null ? info.getLng() : null)
                                .startTime(event.getStartTime())
                                .endTime(event.getEndTime())
                                .eventOrder(event.getEventOrder())
                                .nextTravelTime(event.getNextTravelTime())
                                .build();
                          })
                      .toList();

              return ScheduleListResponseDto.builder()
                  .day(day)
                  .date(dayEvents.get(0).getDate())
                  .events(eventDtos)
                  .build();
            })
        .toList();
  }

  @Override
  @Transactional
  public void commitSchedule(Long roomId, ScheduleCommitRequestDto request) {

    for (Map.Entry<Integer, Integer> entry : request.getVersions().entrySet()) {
      Integer day = entry.getKey();
      Integer clientVersion = entry.getValue();

      Integer serverVersion = redisScheduleService.getDraftVersion(roomId, day);

      if (serverVersion == null) {}

      if (serverVersion == null || !clientVersion.equals(serverVersion)) {
        throw new CustomException(ErrorCode.SCHEDULE_VERSION_CONFLICT);
      }
    }
    // 2. Redis → 전체 일정 조회
    String redisKey = redisScheduleService.getRedisKey(roomId);
    Map<String, DayScheduleRedisDto> drafts = redisScheduleService.getSchedule(redisKey);
    if (drafts.isEmpty()) {
      throw new CustomException(ErrorCode.SCHEDULE_EMPTY_DRAFT);
    }

    // 3. 기존 이벤트 삭제
    Schedule schedule =
        scheduleRepository
            .findByRoomId(roomId)
            .orElseThrow(() -> new CustomException(ErrorCode.SCHEDULE_NOT_FOUND));
    scheduleEventRepository.deleteByScheduleId(schedule.getId());

    // 3-1. Redis에 저장된 모든 wantId 수집
    Set<Long> allWantIds =
        drafts.values().stream()
            .flatMap(draft -> draft.getEvents().stream())
            .map(e -> e.getWantId())
            .collect(Collectors.toSet());

    // 3-2. wantId → WantPlace 매핑 미리 로드
    Map<Long, WantPlace> wantPlaceMap =
        wantPlaceRepository.findAllById(allWantIds).stream()
            .collect(Collectors.toMap(WantPlace::getId, wp -> wp));

    // 3-3. PlaceInfoResolver에 미리 로드 (N+1 방지)
    placeInfoResolver.preload(new ArrayList<>(wantPlaceMap.values()));

    // 4. 새 이벤트 저장
    for (Map.Entry<String, DayScheduleRedisDto> entry : drafts.entrySet()) {
      Integer day = Integer.valueOf(entry.getKey());
      DayScheduleRedisDto draft = entry.getValue();

      draft
          .getEvents()
          .forEach(
              eventDto -> {
                WantPlace wp = wantPlaceMap.get(eventDto.getWantId());
                if (wp == null) {
                  throw new CustomException(ErrorCode.WANT_PLACE_NOT_FOUND);
                }

                ScheduleEvent event =
                    ScheduleEvent.builder()
                        .schedule(schedule)
                        .wantPlace(wp)
                        .day(day)
                        .date(draft.getDate()) // 하루 단위 date 사용
                        .startTime(eventDto.getStartTime())
                        .endTime(eventDto.getEndTime())
                        .eventOrder(eventDto.getEventOrder())
                        .nextTravelTime(
                            eventDto.getNextTravelTime() != null
                                ? eventDto.getNextTravelTime()
                                : null)
                        .build();

                scheduleEventRepository.save(event);
              });
    }
  }

  @Override
  public ScheduleConflictResponseDto handleVersionConflict(Long roomId) {
    // 1) Redis에서 전체 draft 조회
    final String redisKey = redisScheduleService.getRedisKey(roomId);
    Map<String, DayScheduleRedisDto> drafts = redisScheduleService.getSchedule(redisKey);

    if (drafts == null || drafts.isEmpty()) {
      return ScheduleConflictResponseDto.builder()
          .latestVersions(Collections.emptyMap())
          .latestSchedules(Collections.emptyList())
          .build();
    }

    // 2) 모든 wantId 수집 후 WantPlace 일괄 조회 → PlaceInfo preload (N+1 방지)
    Set<Long> allWantIds =
        drafts.values().stream()
            .flatMap(d -> d.getEvents().stream())
            .map(e -> e.getWantId()) // 메서드 레퍼런스 대신 람다
            .collect(Collectors.toSet());

    Map<Long, WantPlace> wantPlaceMap =
        wantPlaceRepository.findAllById(allWantIds).stream()
            .collect(Collectors.toMap(WantPlace::getId, Function.identity()));

    placeInfoResolver.preload(new ArrayList<>(wantPlaceMap.values()));

    // 3) 최신 버전 맵(day -> version)
    Map<Integer, Integer> latestVersions =
        drafts.entrySet().stream()
            .collect(
                Collectors.toMap(
                    e -> Integer.parseInt(e.getKey()), e -> e.getValue().getVersion()));

    // 4) Redis draft → 화면용 DTO 변환 (장소명/이미지/좌표 포함)
    List<ScheduleListResponseDto> latestSchedules =
        drafts.entrySet().stream()
            .sorted(Comparator.comparingInt(e -> Integer.parseInt(e.getKey()))) // day 오름차순
            .map(
                e -> {
                  int day = Integer.parseInt(e.getKey());
                  DayScheduleRedisDto draft = e.getValue();

                  List<ScheduleEventResponseDto> eventDtos =
                      draft.getEvents().stream()
                          .sorted(Comparator.comparingInt(ev -> ev.getEventOrder())) // ❗ 람다
                          .map(
                              ev -> {
                                WantPlace wp = wantPlaceMap.get(ev.getWantId());
                                PlaceInfo info =
                                    (wp != null) ? placeInfoResolver.getPlaceInfo(wp) : null;

                                return ScheduleEventResponseDto.builder()
                                    .wantId(ev.getWantId())
                                    .placeName(info != null ? info.getName() : null)
                                    .placeImg(info != null ? info.getImageUrl() : null)
                                    .lat(info != null ? info.getLat() : null)
                                    .lng(info != null ? info.getLng() : null)
                                    .startTime(ev.getStartTime())
                                    .endTime(ev.getEndTime())
                                    .eventOrder(ev.getEventOrder())
                                    .nextTravelTime(ev.getNextTravelTime())
                                    .build();
                              })
                          .toList();

                  return ScheduleListResponseDto.builder()
                      .day(day)
                      .date(draft.getDate())
                      .events(eventDtos)
                      .build();
                })
            .toList();

    // 5) 충돌 응답 DTO 반환
    return ScheduleConflictResponseDto.builder()
        .latestVersions(latestVersions)
        .latestSchedules(latestSchedules)
        .build();
  }

  @Override
  public List<SchedulePlaceResponseDto> getPlaceListBySchedule(Long roomId) {
    return scheduleRepository.findPlaceNameAddrByRoomId(roomId).stream()
        .map(
            r ->
                SchedulePlaceResponseDto.builder()
                    .placeId(r.getPlaceId())
                    .categoryId(r.getCategoryId())
                    .placeName(r.getPlaceName())
                    .address(r.getAddress())
                    .build())
        .toList();
  }
}
