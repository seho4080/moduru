package com.B108.tripwish.websocket.service;

import java.time.Duration;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.B108.tripwish.domain.route.dto.response.RouteResultResponseDto;
import com.B108.tripwish.domain.route.service.TravelTimeService;
import com.B108.tripwish.websocket.dto.request.TravelTimeCalcRequestDto;
import com.B108.tripwish.websocket.dto.response.TravelTimeStatusMessage;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TravelTimeJobRunnerService {

  private final TravelTimeService travelTimeService;
  private final RedisPublisher redisPublisher; // 쓰는 방식에 맞춰 선택
  private final StringRedisTemplate redis; // 중복 클릭 락(선택)
  private final RedisScheduleService redisScheduleService;
  // 중복 클릭 방지용 TTL(초)
  private static final Duration LOCK_TTL = Duration.ofSeconds(20);

  @Async("travelTaskExecutor")
  public void run(Long roomId, TravelTimeCalcRequestDto req) {
    String lockKey = "travel:calc:lock:" + roomId + ":" + req.getDay();
    try {
      // 0) 락 획득 시도 (이미 계산 중이면 ALREADY_RUNNING 전송 후 종료)
      Boolean ok = redis.opsForValue().setIfAbsent(lockKey, "1", LOCK_TTL);
      if (Boolean.FALSE.equals(ok)) {
        redisPublisher.publish(
            RedisChannelType.TRAVEL_TIME_STATUS,
            TravelTimeStatusMessage.builder()
                .roomId(roomId)
                .day(req.getDay())
                .status(TravelTimeStatusMessage.Status.ALREADY_RUNNING)
                .message("calculation already running")
                .build());
        return;
      }

      // 1) ACK
      redisPublisher.publish(
          RedisChannelType.TRAVEL_TIME_STATUS,
          TravelTimeStatusMessage.builder()
              .roomId(roomId)
              .day(req.getDay())
              .status(TravelTimeStatusMessage.Status.STARTED)
              .message("calculation started")
              .build());

      // 2) 계산
      RouteResultResponseDto result =
          travelTimeService.estimate(
              req.getRoomId(), req.getDay(), req.getDate(), req.getTransport(), req.getEvents());

      // 3) 스케줄 해시에 nextTravelTime(분) 반영 (버전 증가 X)
      redisScheduleService.applyTravelTimesFromResult(result);

      // 4) 결과 브로드캐스트
      redisPublisher.publish(RedisChannelType.TRAVEL_TIME_RESULT, result);

      // 5) 완료
      redisPublisher.publish(
          RedisChannelType.TRAVEL_TIME_STATUS,
          TravelTimeStatusMessage.builder()
              .roomId(roomId)
              .day(req.getDay())
              .status(TravelTimeStatusMessage.Status.DONE)
              .message("calculation done")
              .build());

    } catch (Exception e) {
      redisPublisher.publish(
          RedisChannelType.TRAVEL_TIME_STATUS,
          TravelTimeStatusMessage.builder()
              .roomId(roomId)
              .day(req.getDay())
              .status(TravelTimeStatusMessage.Status.FAILED)
              .message(e.getMessage())
              .build());
    } finally {
      // 락 해제 (TTL도 있지만 명시적으로 제거)
      redis.delete(lockKey);
    }
  }
}
