package com.B108.tripwish.websocket.service;

import com.B108.tripwish.websocket.dto.request.PlaceWantMessageRequestDto;
import com.B108.tripwish.websocket.dto.response.PlaceWantMessageResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PlaceWantSocketService {

    private final RedisPublisher redisPublisher;

    public void handlePlaceWantMessage(PlaceWantMessageRequestDto req) {
        // DB 저장 로직은 생략. 테스트용 더미 처리만.

        // 응답 메시지 구성
        PlaceWantMessageResponseDto res = PlaceWantMessageResponseDto.builder()
                .type(req.getType())
                .roomId(req.getRoomId())
                .id(req.getId())
                .lat(req.getLat())
                .lng(req.getLng())
                .build();

        // Redis pub/sub로 전송
        String topic = "/topic/room/" + req.getRoomId() + "/place-want";
        redisPublisher.publish(topic, res);
    }
}
