package com.B108.tripwish.websocket.controller;

import com.B108.tripwish.websocket.dto.request.TravelTimeCalcRequestDto;
import com.B108.tripwish.websocket.dto.response.TravelTimeStatusMessage;
import com.B108.tripwish.websocket.service.TravelTimeJobRunnerService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class TravelTimeSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final TravelTimeJobRunnerService travelTimeJobRunnerService;

    @MessageMapping("/rooms/{roomId}/travel/calc") // 클라가 /pub/rooms/{roomId}/travel/calc 로 보냄
    public void calculate(@DestinationVariable Long roomId,
                          TravelTimeCalcRequestDto req) {

        // 1) ACK(로딩 시작) 먼저 전송
        messagingTemplate.convertAndSend(
                "/sub/rooms/" + roomId + "/travel/status",
                TravelTimeStatusMessage.builder()
                        .roomId(roomId).day(req.getDay())
                        .status(TravelTimeStatusMessage.Status.STARTED)
                        .message("calculation started")
                        .build()
        );

        // 2) 비동기 실행 (버튼 중복 클릭 방지 락은 아래 JobRunner 안에서 처리)
        travelTimeJobRunnerService.run(roomId, req);
    }
}

