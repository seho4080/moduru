package com.B108.tripwish.websocket.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

import com.B108.tripwish.websocket.subscriber.PlaceWantRedisSubscriber;
import com.B108.tripwish.websocket.subscriber.ScheduleRedisSubscriber;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
public class RedisSubscriberConfig {

  private final RedisMessageListenerContainer listenerContainer;
  private final ScheduleRedisSubscriber scheduleRedisSubscriber;
  private final PlaceWantRedisSubscriber placeWantRedisSubscriber;

  @PostConstruct
  public void init() {
    listenerContainer.addMessageListener(
        scheduleRedisSubscriber, new PatternTopic("/topic/room/*/schedule"));
    listenerContainer.addMessageListener(
        placeWantRedisSubscriber, new PatternTopic("/topic/room/*/place-want"));
  }
}
