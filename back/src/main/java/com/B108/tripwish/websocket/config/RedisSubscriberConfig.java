package com.B108.tripwish.websocket.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

import com.B108.tripwish.websocket.subscriber.*;

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
  private final TravelTimeStatusSubscriber travelTimeStatusSubscriber;
  private final TravelTimeResultSubscriber travelTimeResultSubscriber;
  private final AiScheduleResultSubscriber aiScheduleResultSubscriber;
  private final AiScheduleStatusSubscriber aiScheduleStatusSubscriber;
  private final AiRouteStatusSubscriber aiRouteStatusSubscriber;
  private final AiRouteResultSubscriber aiRouteResultSubscriber;

  @PostConstruct
  public void init() {
    // RedisChannelType 기반으로 구독
    listenerContainer.addMessageListener(scheduleRedisSubscriber, new PatternTopic("schedule"));
    listenerContainer.addMessageListener(
        placeWantAddSubscriber, new PatternTopic("place-want:add"));
    listenerContainer.addMessageListener(
        placeWantRemoveSubscriber, new PatternTopic("place-want:remove"));
    listenerContainer.addMessageListener(votePlaceSubscriber, new PatternTopic("place:vote"));
    listenerContainer.addMessageListener(
        travelTimeStatusSubscriber, new PatternTopic("travel:status"));
    listenerContainer.addMessageListener(
        travelTimeResultSubscriber, new PatternTopic("travel:result"));
    listenerContainer.addMessageListener(
            aiScheduleStatusSubscriber, new PatternTopic("ai-schedule:status"));
    listenerContainer.addMessageListener(
            aiScheduleResultSubscriber, new PatternTopic("ai-schedule:result"));
    listenerContainer.addMessageListener(
            aiRouteResultSubscriber, new PatternTopic("ai-route:result"));
    listenerContainer.addMessageListener(
            aiRouteStatusSubscriber, new PatternTopic("ai-route:status"));
  }
}
