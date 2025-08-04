package com.B108.tripwish.websocket.controller;

import com.B108.tripwish.websocket.dto.request.ScheduleMessageRequestDto;
import com.B108.tripwish.websocket.service.ScheduleSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

@RequiredArgsConstructor
@Controller
@Slf4j
public class ScheduleSocketController {

    private final ScheduleSocketService scheduleSocketService;

    @MessageMapping("/room/{roomId}/schedule")
    public void handleSchedule(@DestinationVariable String roomId, @Payload ScheduleMessageRequestDto message) {
        log.info("🧾 WebSocket 메시지 수신: roomId={}, message={}", roomId, message);
        scheduleSocketService.broadcastSchedule(roomId, message);
    }
}
