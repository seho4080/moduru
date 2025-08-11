package com.B108.tripwish.websocket.subscriber;

import com.B108.tripwish.domain.route.dto.response.RouteResultResponseDto;
import com.B108.tripwish.websocket.dto.response.LegResponseDto;
import com.B108.tripwish.websocket.dto.response.TravelTimeResultMessageResponseDto;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import static java.nio.charset.StandardCharsets.UTF_8;


@Slf4j
@Component
@RequiredArgsConstructor
public class TravelTimeResultSubscriber implements MessageListener {

    private final ObjectMapper om;          // 스프링 공용 ObjectMapper 주입(자바타임 모듈 포함)
    private final SimpMessagingTemplate msg;

    @Override
    public void onMessage(Message m, byte[] p) {
        String body = new String(m.getBody(), UTF_8);
        try {
            // Redis에 저장된(혹은 퍼블리시된) 초 단위 DTO 파싱
            RouteResultResponseDto dto = om.readValue(body, RouteResultResponseDto.class);

            // 분 단위 메시지로 변환
            var legs = dto.getLegs().stream()
                    .map(l -> LegResponseDto.builder()
                            .fromWantId(l.getFromWantId())
                            .toWantId(l.getToWantId())
                            .distanceMeters(l.getDistanceMeters())
                            .durationMinutes(toMinutes(l.getDurationSec()))
                            .build())
                    .toList();

            var out = TravelTimeResultMessageResponseDto.builder()
                    .roomId(dto.getRoomId())
                    .day(dto.getDay())
                    .mode(dto.getMode())
                    .totalDistanceMeters(dto.getTotalDistanceMeters())
                    .totalDurationMinutes(toMinutes(dto.getTotalDurationSec()))
                    .legs(legs)
                    .build();

            // STOMP 브로드캐스트는 분 단위 메시지를 사용
            msg.convertAndSend("/sub/rooms/" + dto.getRoomId() + "/travel/result", out);

        } catch (JsonProcessingException e) {
            log.warn("travel:result JSON parse failed: {}", body, e);
        } catch (Exception e) {
            log.error("travel:result handle error", e);
        }
    }

    private static long toMinutes(long sec) {
        return Math.round(sec / 60.0); // 반올림 (원하면 올림/내림으로 변경)
    }
}