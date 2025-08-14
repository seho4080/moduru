package com.B108.tripwish.domain.route.service;

import java.time.LocalDate;
import java.util.List;

import com.B108.tripwish.domain.route.dto.response.RouteResultResponseDto;
import com.B108.tripwish.websocket.dto.request.EventRequestDto;

public interface TravelTimeService {
  public RouteResultResponseDto estimateAuto(
      Long roomId, int day, LocalDate date, List<EventRequestDto> events);

  RouteResultResponseDto estimate(
      Long roomId, int day, LocalDate date, String transport, List<EventRequestDto> events);
}
