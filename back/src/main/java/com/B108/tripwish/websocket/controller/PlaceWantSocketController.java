package com.B108.tripwish.websocket.controller;

import com.B108.tripwish.domain.auth.security.JwtTokenProvider;
import com.B108.tripwish.websocket.dto.request.PlaceWantMessageRequestDto;
import com.B108.tripwish.websocket.service.PlaceWantSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

@RequiredArgsConstructor
@Controller
@Slf4j
public class PlaceWantSocketController {

    private final PlaceWantSocketService placeWantSocketService;
    private final JwtTokenProvider jwtTokenProvider;

    @MessageMapping("/room/{roomId}/place-want")
    public void handlePlaceWantMessage(@DestinationVariable String roomId,
                                       @Payload PlaceWantMessageRequestDto request) {

        // 2. 서비스 위임
        log.info("📩 WebSocket 메시지 수신: roomId={}, type={}", roomId, request.getType());
        placeWantSocketService.handlePlaceWantMessage(request);
    }
}
