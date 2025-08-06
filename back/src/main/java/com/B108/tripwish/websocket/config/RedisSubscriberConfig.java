package com.B108.tripwish.websocket.config;

import com.B108.tripwish.websocket.subscriber.PlaceWantRedisSubscriber;
import com.B108.tripwish.websocket.subscriber.ScheduleRedisSubscriber;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

@Configuration
@RequiredArgsConstructor
public class RedisSubscriberConfig {

    @Qualifier("redisMessageListenerContainer")
    private final RedisMessageListenerContainer listenerContainer;
    private final ScheduleRedisSubscriber scheduleRedisSubscriber;
    private final PlaceWantRedisSubscriber placeWantRedisSubscriber;

    @PostConstruct
    public void init() {
        // 해당 채널(경로)를 구독
        listenerContainer.addMessageListener(scheduleRedisSubscriber, new PatternTopic("room.*.schedule"));
        listenerContainer.addMessageListener(placeWantRedisSubscriber, new PatternTopic("room.*.place-want"));
    }


}
