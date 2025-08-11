package com.B108.tripwish.domain.route.service;

import com.B108.tripwish.domain.route.dto.response.RouteResultResponseDto;
import com.B108.tripwish.websocket.dto.request.EventRequestDto;

import java.time.LocalDate;
import java.util.List;

public interface TravelTimeService {
    public RouteResultResponseDto estimateAuto(Long roomId, int day, LocalDate date, List<EventRequestDto> events);
}
