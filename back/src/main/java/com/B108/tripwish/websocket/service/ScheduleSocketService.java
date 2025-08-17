package com.B108.tripwish.websocket.service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.room.entity.WantPlace;
import com.B108.tripwish.domain.room.repository.WantPlaceRepository;
import com.B108.tripwish.global.util.PlaceInfo;
import com.B108.tripwish.global.util.PlaceInfoResolver;
import com.B108.tripwish.websocket.dto.redis.DayScheduleRedisDto;
import com.B108.tripwish.websocket.dto.request.ScheduleEventMessageRequestDto;
import com.B108.tripwish.websocket.dto.request.ScheduleMessageRequestDto;
import com.B108.tripwish.websocket.dto.response.ScheduleEventMessageResponseDto;
import com.B108.tripwish.websocket.dto.response.ScheduleMessageResponseDto;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ScheduleSocketService {

  private final RedisPublisher redisPublisher;
  private final WantPlaceRepository wantPlaceRepository;
  private final PlaceInfoResolver placeInfoResolver;
  private final RedisScheduleService redisScheduleService;
  private final RedisTemplate<String, Object> redisTemplate;

  private final SimpMessagingTemplate messagingTemplate;

  public void updateSchedule(
      CustomUserDetails sender, Long roomId, ScheduleMessageRequestDto request) {
    Long userId = sender.getUser().getId();

    // 0. 이벤트에서 WantPlaceId 추출
    List<Long> wantIds =
        request.getEvents().stream()
            .map(ScheduleEventMessageRequestDto::getWantId)
            .distinct()
            .toList();

    // 1. WantPlace 리스트 추출 → preload
    List<WantPlace> wantPlaces = wantPlaceRepository.findAllById(wantIds);

    // 🔑 여기서 Map 생성
    Map<Long, WantPlace> wantPlaceMap =
        wantPlaces.stream().collect(Collectors.toMap(WantPlace::getId, Function.identity()));

    // 2. PlaceInfoResolver preload (쿼리 2회)
    placeInfoResolver.preload(wantPlaces);

    // 3. 응답 DTO 생성
    List<ScheduleEventMessageResponseDto> responseEvents =
        request.getEvents().stream()
            .sorted(Comparator.comparing(ScheduleEventMessageRequestDto::getEventOrder))
            .map(
                dto -> {
                  WantPlace wp = wantPlaceMap.get(dto.getWantId());
                  PlaceInfo info = placeInfoResolver.getPlaceInfo(wp);

                  return new ScheduleEventMessageResponseDto(
                      wp.getId(),
                      info != null ? info.getImageUrl() : null,
                      info != null ? info.getName() : null,
                      dto.getStartTime(),
                      dto.getEndTime(),
                      dto.getEventOrder(),
                      info != null ? info.getLat() : null,
                      info != null ? info.getLng() : null);
                })
            .toList();

    // 2. Redis에 저장
    final String redisKey = "schedule:" + roomId;
    final Integer day = request.getDay();
    final LocalDate date = request.getDate();

    // Redis에서 해당 day의 기존 데이터 조회
    DayScheduleRedisDto existing = redisScheduleService.getScheduleByDay(redisKey, day);

    // 구조 변경 여부 판별
    boolean structuralChange = isStructuralChanged(existing, request.getEvents());

    if (structuralChange) {
      request.getEvents().forEach(e -> e.setNextTravelTime(null));
    }

    // 3. 원자적으로 버전 증가
    Long newVersion =
        redisTemplate
            .<String, Object>opsForHash()
            .increment(
                "schedule:" + roomId + ":versions", day.toString(), structuralChange ? 1 : 0);

    // 4. DTO 생성 (버전 반영)
    DayScheduleRedisDto toSave =
        DayScheduleRedisDto.builder()
            .date(date)
            .version(newVersion.intValue())
            .events(request.getEvents())
            .build();

    // 5. 본문 저장
    redisScheduleService.saveSchedule(redisKey, day, toSave);

    // 브로드캐스트 payload에 draftVersion 포함
    ScheduleMessageResponseDto response =
        ScheduleMessageResponseDto.builder()
            .roomId(request.getRoomId())
            .day(request.getDay())
            .date(request.getDate())
            .events(responseEvents)
            .senderId(sender.getUuid().toString())
            .draftVersion(newVersion.intValue()) // 프론트 Redux가 저장할 최신값
            .build();

    // 7. WebSocket 브로드캐스트
    redisPublisher.publish(RedisChannelType.SCHEDULE_UPDATE, response);
  }

  private boolean isStructuralChanged(
      DayScheduleRedisDto existing, List<ScheduleEventMessageRequestDto> newEvents) {
    // 기존 데이터가 없으면 구조 변경으로 간주
    if (existing == null) {
      return true;
    }

    List<ScheduleEventMessageRequestDto> oldEvents = existing.getEvents();

    // 이벤트 개수가 달라졌으면 구조 변경
    if (oldEvents.size() != newEvents.size()) {
      return true;
    }

    // 각 이벤트의 wantId, startTime, endTime, eventOrder 비교
    for (int i = 0; i < oldEvents.size(); i++) {
      ScheduleEventMessageRequestDto oldE = oldEvents.get(i);
      ScheduleEventMessageRequestDto newE = newEvents.get(i);

      if (!Objects.equals(oldE.getWantId(), newE.getWantId())
          || !Objects.equals(oldE.getStartTime(), newE.getStartTime())
          || !Objects.equals(oldE.getEndTime(), newE.getEndTime())
          || oldE.getEventOrder() != newE.getEventOrder()) {
        return true; // 핵심 구조가 바뀌면 true
      }
    }

    // 여기까지 왔다면 구조는 동일, 소요시간만 변경됐거나 그대로임
    return false;
  }
}
