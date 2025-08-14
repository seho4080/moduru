package com.B108.tripwish.websocket.subscriber;

import static java.nio.charset.StandardCharsets.UTF_8;

import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import com.B108.tripwish.websocket.dto.response.TravelTimeStatusMessage;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class TravelTimeStatusSubscriber implements MessageListener {

  private final ObjectMapper om;
  private final SimpMessagingTemplate msg;

  @Override
  public void onMessage(Message m, byte[] p) {
    String body = new String(m.getBody(), UTF_8);
    try {
      TravelTimeStatusMessage dto = om.readValue(body, TravelTimeStatusMessage.class);
      msg.convertAndSend("/topic/room/" + dto.getRoomId() + "/travel/status", dto);
    } catch (JsonProcessingException e) {
      log.warn("travel:status JSON parse failed: {}", body, e);
    } catch (Exception e) {
      log.error("travel:status handle error", e);
    }
  }
}
