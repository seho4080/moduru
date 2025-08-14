package com.B108.tripwish.websocket.subscriber;

import static java.nio.charset.StandardCharsets.UTF_8;

import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import com.B108.tripwish.domain.route.dto.response.RouteResultResponseDto;
import com.B108.tripwish.domain.schedule.entity.TransportType;
import com.B108.tripwish.websocket.dto.response.LegResponseDto;
import com.B108.tripwish.websocket.dto.response.TravelTimeResultMessageResponseDto;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class TravelTimeResultSubscriber implements MessageListener {

  private final ObjectMapper om; // 스프링 공용 ObjectMapper 주입(자바타임 모듈 포함)
  private final SimpMessagingTemplate msg;

  @Override
  public void onMessage(Message m, byte[] p) {
    String body = new String(m.getBody(), UTF_8);
    log.info("📥 [travel:result] Redis 메시지 수신: {}", body);
    try {
      RouteResultResponseDto dto = om.readValue(body, RouteResultResponseDto.class);
      log.info(
          "✅ [travel:result] 파싱 성공: roomId={}, day={}, transport={}, legs={}",
          dto.getRoomId(),
          dto.getDay(),
          dto.getTransport(),
          dto.getLegs().size());
      var legs =
          dto.getLegs().stream()
              .map(
                  l ->
                      LegResponseDto.builder()
                          .fromWantId(l.getFromWantId())
                          .toWantId(l.getToWantId())
                          .distanceMeters(l.getDistanceMeters())
                          .durationMinutes(toMinutes(l.getDurationSec()))
                          .transport(toTransportString(l.getTransport())) // enum → string
                          .build())
              .toList();

      var out =
          TravelTimeResultMessageResponseDto.builder()
              .roomId(dto.getRoomId())
              .day(dto.getDay())
              .transport(toTransportString(dto.getTransport())) // enum → string
              .totalDistanceMeters(dto.getTotalDistanceMeters())
              .totalDurationMinutes(toMinutes(dto.getTotalDurationSec()))
              .legs(legs)
              .build();

      String topic = "/topic/room/" + dto.getRoomId() + "/travel/result";
      msg.convertAndSend(topic, out);
      log.info(
          "📣 [travel:result] WebSocket 전송 완료: topic={}, totalDurationMinutes={}",
          topic,
          out.getTotalDurationMinutes());

    } catch (JsonProcessingException e) {
      log.warn("❌ [travel:result] JSON 파싱 실패: {}", body, e);
    } catch (Exception e) {
      log.error("❌ [travel:result] 메시지 처리 에러", e);
    }
  }

  private static long toMinutes(long sec) {
    return Math.round(sec / 60.0);
  }

  private static String toTransportString(TransportType t) {
    return (t == null) ? null : t.name().toLowerCase();
  }
}
