// src/main/java/com/B108/tripwish/infra/lock/RedisRoomLockService.java
package com.B108.tripwish.infra.lock;

import com.B108.tripwish.global.lock.RoomLockService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component // 운영/개발 기본 프로필에서 사용
@RequiredArgsConstructor
public class RedisRoomLockService implements RoomLockService {

    private final StringRedisTemplate redis;

    @Value("${lock.ttl.schedule-seconds:180}") // 기본 3분
    private long scheduleTtlSec;

    @Value("${lock.ttl.route-seconds:120}")    // 기본 2분
    private long routeTtlSec;

    private String keySchedule(Long roomId) {
        return "ai:schedule:lock:" + roomId;
    }
    private String keyRoute(Long roomId, int day) {
        return "ai:route:lock:" + roomId + ":" + day;
    }

    @Override
    public boolean acquireScheduleLock(Long roomId) {
        return tryAcquire(keySchedule(roomId), scheduleTtlSec);
    }

    @Override
    public void releaseScheduleLock(Long roomId) {
        redis.delete(keySchedule(roomId));
    }

    @Override
    public boolean acquireRouteLock(Long roomId, int day) {
        return tryAcquire(keyRoute(roomId, day), routeTtlSec);
    }

    @Override
    public void releaseRouteLock(Long roomId, int day) {
        redis.delete(keyRoute(roomId, day));
    }

    private boolean tryAcquire(String key, long ttlSeconds) {
        return Boolean.TRUE.equals(
                redis.opsForValue().setIfAbsent(key, "1", Duration.ofSeconds(ttlSeconds))
        );
    }
}
