package com.B108.tripwish.websocket.controller;

import com.B108.tripwish.domain.auth.security.JwtTokenProvider;
import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.websocket.dto.request.PlaceWantMessageRequestDto;
import com.B108.tripwish.websocket.service.PlaceWantSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.MessageHeaders;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@RequiredArgsConstructor
@Controller
@Slf4j
public class PlaceWantSocketController {

    private final PlaceWantSocketService placeWantSocketService;

    @MessageMapping("/room/{roomId}/place-want/add")
    public void handlePlaceWantAddMessage(@DestinationVariable Long roomId,
                                       @Payload PlaceWantMessageRequestDto request,
                                       MessageHeaders headers) {

        // 1. 사용자 정보 꺼내기
        SimpMessageHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(headers, SimpMessageHeaderAccessor.class);
        CustomUserDetails user = (CustomUserDetails) accessor.getSessionAttributes().get("user");


        // 2. 서비스 위임
        log.info("📩 WebSocket 메시지 수신: roomId={}, type={}", roomId, request.getType());
        // 2. 요청 타입에 따라 분기
        placeWantSocketService.handleAdd(user, roomId, request);

    }


    @MessageMapping("/room/{roomId}/place-want/remove")
    public void handlePlaceWantRemoveMessage(@DestinationVariable Long roomId,
                                       @Payload PlaceWantMessageRequestDto request,
                                       MessageHeaders headers) {

        // 1. 사용자 정보 꺼내기
        SimpMessageHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(headers, SimpMessageHeaderAccessor.class);
        CustomUserDetails user = (CustomUserDetails) accessor.getSessionAttributes().get("user");


        // 2. 서비스 위임
        log.info("📩 WebSocket 메시지 수신: roomId={}, type={}", roomId, request.getType());
        // 2. 요청 타입에 따라 분기
        placeWantSocketService.handleRemove(user, roomId, request);

    }
}
