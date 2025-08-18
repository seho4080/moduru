package com.B108.tripwish.websocket.controller;

import org.springframework.messaging.MessageHeaders;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.websocket.dto.request.ScheduleMessageRequestDto;
import com.B108.tripwish.websocket.service.ScheduleSocketService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RequiredArgsConstructor
@Controller
@Slf4j
public class ScheduleSocketController {

  private final ScheduleSocketService scheduleSocketService;

  @MessageMapping("/room/{roomId}/schedule")
  public void handleSchedule(
      @DestinationVariable Long roomId,
      @Payload ScheduleMessageRequestDto request,
      MessageHeaders headers) {

    // 1. 사용자 정보 꺼내기
    SimpMessageHeaderAccessor accessor =
        MessageHeaderAccessor.getAccessor(headers, SimpMessageHeaderAccessor.class);
    CustomUserDetails user = (CustomUserDetails) accessor.getSessionAttributes().get("user");

    log.info("🧾 WebSocket 메시지 수신: roomId={}, day={}", roomId, request.getDay());
    scheduleSocketService.updateSchedule(user, roomId, request);
  }
}
