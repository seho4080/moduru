package com.B108.tripwish.websocket.service;

import com.B108.tripwish.domain.route.dto.response.RouteResultResponseDto;
import com.B108.tripwish.domain.route.service.TravelTimeService;
import com.B108.tripwish.websocket.dto.request.TravelTimeCalcRequestDto;
import com.B108.tripwish.websocket.dto.response.TravelTimeStatusMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class TravelTimeJobRunnerService {

    private final TravelTimeService travelTimeService;
    private final RedisPublisher redisPublisher;               // 쓰는 방식에 맞춰 선택
    private final StringRedisTemplate redis; // 중복 클릭 락(선택)
    private final RedisScheduleService redisScheduleService;
    // 중복 클릭 방지용 TTL(초)
    private static final Duration LOCK_TTL = Duration.ofSeconds(20);

    @Async("travelTaskExecutor")
    public void run(Long roomId, TravelTimeCalcRequestDto req) {
        try {
            // ACK -> Redis Publish
            redisPublisher.publish(RedisChannelType.TRAVEL_TIME_STATUS,
                    TravelTimeStatusMessage.builder()
                            .roomId(roomId).day(req.getDay())
                            .status(TravelTimeStatusMessage.Status.STARTED)
                            .message("calculation started")
                            .build());

            RouteResultResponseDto result =
                    travelTimeService.estimateAuto(roomId, req.getDay(), req.getDate(), req.getEvents());

            redisScheduleService.applyTravelTimesFromResult(result);

            // 결과 -> Redis Publish
            redisPublisher.publish(RedisChannelType.TRAVEL_TIME_RESULT, result);

            // DONE -> Redis Publish
            redisPublisher.publish(RedisChannelType.TRAVEL_TIME_STATUS,
                    TravelTimeStatusMessage.builder()
                            .roomId(roomId).day(req.getDay())
                            .status(TravelTimeStatusMessage.Status.DONE)
                            .message("calculation done")
                            .build());

        } catch (Exception e) {
            redisPublisher.publish(RedisChannelType.TRAVEL_TIME_STATUS,
                    TravelTimeStatusMessage.builder()
                            .roomId(roomId).day(req.getDay())
                            .status(TravelTimeStatusMessage.Status.FAILED)
                            .message(e.getMessage())
                            .build());
        }
    }

}

