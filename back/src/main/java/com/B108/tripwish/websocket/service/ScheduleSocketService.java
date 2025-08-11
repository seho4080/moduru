package com.B108.tripwish.websocket.service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.room.entity.WantPlace;
import com.B108.tripwish.domain.room.repository.WantPlaceRepository;
import com.B108.tripwish.domain.schedule.repository.ScheduleEventRepository;
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

  private final ScheduleEventRepository scheduleEventRepository;
  private final WantPlaceRepository wantPlaceRepository;
  private final PlaceInfoResolver placeInfoResolver;
  private final RedisScheduleService redisScheduleService;

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
                      dto.getStartTime().atTime(0, 0).toLocalTime(),
                      dto.getEndTime().atTime(0, 0).toLocalTime(),
                      dto.getEventOrder(),
                      info != null ? info.getLat() : null,
                      info != null ? info.getLng() : null);
                })
            .toList();

    ScheduleMessageResponseDto response =
        ScheduleMessageResponseDto.builder()
            .roomId(request.getRoomId())
            .day(request.getDay())
            .date(request.getDate())
            .events(responseEvents)
            .senderId(sender.getUuid().toString())
            .build();

    // 2. Redis에 저장
    LocalDate date = request.getDate();

    DayScheduleRedisDto redisDto = new DayScheduleRedisDto(date, request.getEvents());

    String redisKey = "schedule:" + roomId;
    redisScheduleService.saveSchedule(redisKey, request.getDay(), redisDto);

    // 7. WebSocket 브로드캐스트
    messagingTemplate.convertAndSend("/topic/room/" + roomId + "/schedule", response);
  }
}
