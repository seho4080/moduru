package com.B108.tripwish.domain.schedule.service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.B108.tripwish.domain.room.entity.WantPlace;
import com.B108.tripwish.domain.schedule.dto.response.ScheduleEventResponseDto;
import com.B108.tripwish.domain.schedule.dto.response.ScheduleListResponseDto;
import com.B108.tripwish.domain.schedule.entity.Schedule;
import com.B108.tripwish.domain.schedule.entity.ScheduleEvent;
import com.B108.tripwish.domain.schedule.repository.ScheduleEventRepository;
import com.B108.tripwish.domain.schedule.repository.ScheduleRepository;
import com.B108.tripwish.global.exception.CustomException;
import com.B108.tripwish.global.exception.ErrorCode;
import com.B108.tripwish.global.util.PlaceInfo;
import com.B108.tripwish.global.util.PlaceInfoResolver;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduleServiceImpl implements ScheduleService {

  private final ScheduleRepository scheduleRepository;
  private final ScheduleEventRepository scheduleEventRepository;
  private final PlaceInfoResolver placeInfoResolver;

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
}
