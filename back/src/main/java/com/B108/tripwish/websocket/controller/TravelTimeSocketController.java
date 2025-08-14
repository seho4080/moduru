package com.B108.tripwish.websocket.controller;

import org.springframework.messaging.MessageHeaders;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.B108.tripwish.websocket.dto.request.TravelTimeCalcRequestDto;
import com.B108.tripwish.websocket.dto.response.TravelTimeStatusMessage;
import com.B108.tripwish.websocket.service.TravelTimeJobRunnerService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Controller
@RequiredArgsConstructor
public class TravelTimeSocketController {

  private final SimpMessagingTemplate messagingTemplate;
  private final TravelTimeJobRunnerService travelTimeJobRunnerService;

  @MessageMapping("/room/{roomId}/travel/calc") // 클라가 /app/room/{roomId}/travel/calc 로 보냄
  public void calculate(
      @DestinationVariable Long roomId,
      @Payload TravelTimeCalcRequestDto req,
      MessageHeaders headers) {

    log.info(
        "📩 WebSocket 메시지 수신: roomId={}, type={}, id={}", roomId, req.getEvents(), req.getDay());
    // 1) ACK(로딩 시작) 먼저 전송
    messagingTemplate.convertAndSend(
        "/topic/room/" + roomId + "/travel/status",
        TravelTimeStatusMessage.builder()
            .roomId(roomId)
            .day(req.getDay())
            .status(TravelTimeStatusMessage.Status.STARTED)
            .message("calculation started")
            .build());

    // 2) 비동기 실행 (버튼 중복 클릭 방지 락은 아래 JobRunner 안에서 처리)
    travelTimeJobRunnerService.run(roomId, req);
  }
}
