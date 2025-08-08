package com.B108.tripwish.websocket.config;

import com.B108.tripwish.websocket.subscriber.VotePlaceSubscriber;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

import com.B108.tripwish.websocket.subscriber.PlaceWantAddSubscriber;
import com.B108.tripwish.websocket.subscriber.PlaceWantRemoveSubscriber;
import com.B108.tripwish.websocket.subscriber.ScheduleRedisSubscriber;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
public class RedisSubscriberConfig {

  @Qualifier("redisMessageListenerContainer")
  private final RedisMessageListenerContainer listenerContainer;

  private final ScheduleRedisSubscriber scheduleRedisSubscriber;
  private final PlaceWantAddSubscriber placeWantAddSubscriber;
  private final PlaceWantRemoveSubscriber placeWantRemoveSubscriber;
  private final VotePlaceSubscriber votePlaceSubscriber;

  @PostConstruct
  public void init() {
    // RedisChannelType 기반으로 구독
    listenerContainer.addMessageListener(scheduleRedisSubscriber, new PatternTopic("schedule"));
    listenerContainer.addMessageListener(
        placeWantAddSubscriber, new PatternTopic("place-want:add"));
    listenerContainer.addMessageListener(
        placeWantRemoveSubscriber, new PatternTopic("place-want:remove"));
    listenerContainer.addMessageListener(votePlaceSubscriber, new PatternTopic("place:vote"));
  }
}
