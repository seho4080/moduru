// src/main/java/com/B108/tripwish/websocket/service/AiRoutePublisherImpl.java
package com.B108.tripwish.websocket.service;

import com.B108.tripwish.domain.route.websocket.AiRoutePublisher;
import com.B108.tripwish.websocket.dto.response.AiRecommendBroadcastDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import static com.B108.tripwish.websocket.service.AiTaskType.ROUTE;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiRoutePublisherImpl implements AiRoutePublisher {

    private final RedisPublisher redisPublisher;
    private final RedisAiService redisAiService;

    private Map<String, Object> basePayload(Long roomId, String jobId) {
        Map<String, Object> m = new HashMap<>();
        m.put("roomId", roomId);
        m.put("jobId", jobId);
        m.put("updatedAt", Instant.now().toString());
        return m;
    }

    /** front로 보낼 status 페이로드로 변환: type→status, days 제거 */
    private Map<String, Object> toFrontStatusPayload(Map<String, Object> source) {
        Map<String, Object> front = new HashMap<>(source);
        Object typeVal = front.remove("type"); // type -> status
        if (typeVal != null) front.put("status", typeVal.toString());
        front.remove("days"); // 프론트 불필요
        return front;
    }

    @Override
    public void started(Long roomId, String jobId, int days) {
        Map<String, Object> m = basePayload(roomId, jobId);

        // 🔒 Route 네임스페이스로 상태 저장
        redisAiService.saveStarted(ROUTE, roomId, jobId, days, m);

        m.put("type", "STARTED");
        m.put("days", days);

        Map<String, Object> front = toFrontStatusPayload(m);
        log.info("[AI-ROUTE][PUBLISH] STARTED → roomId={}, jobId={}, days={}, frontPayload={}",
                roomId, jobId, days, front);
        redisPublisher.publish(RedisChannelType.AI_ROUTE_STATUS, front);
    }

    @Override
    public void progress(Long roomId, String jobId, int progress) {
        Map<String, Object> m = basePayload(roomId, jobId);

        // 🔒 Route 네임스페이스로 진행률 저장(스로틀링)
        redisAiService.saveProgressThrottled(ROUTE, roomId, jobId, progress, m);

        m.put("type", "PROGRESS");
        m.put("progress", progress);

        Map<String, Object> front = toFrontStatusPayload(m);
        log.info("[AI-ROUTE][PUBLISH] PROGRESS → roomId={}, jobId={}, progress={}, frontPayload={}",
                roomId, jobId, progress, front);
        redisPublisher.publish(RedisChannelType.AI_ROUTE_STATUS, front);
    }

    @Override
    public void done(Long roomId, String jobId, AiRecommendBroadcastDto result) {
        Map<String, Object> base = basePayload(roomId, jobId);

        // 상태 채널 (DONE)
        Map<String, Object> s = new HashMap<>(base);
        s.put("type", "DONE");
        Map<String, Object> frontStatus = toFrontStatusPayload(s);
        log.info("[AI-ROUTE][PUBLISH] DONE(status) → roomId={}, jobId={}, frontPayload={}",
                roomId, jobId, frontStatus);
        redisPublisher.publish(RedisChannelType.AI_ROUTE_STATUS, frontStatus);

        // 🔒 결과 저장 (Route 네임스페이스)
        redisAiService.saveDone(ROUTE, roomId, jobId, result, base);

        // 결과 채널 (RESULT는 그대로 전달)
        Map<String, Object> m = new HashMap<>(base);
        m.put("type", "RESULT");
        m.put("result", result);
        log.info("[AI-ROUTE][PUBLISH] RESULT(data) → roomId={}, jobId={}, payload={}",
                roomId, jobId, m);
        redisPublisher.publish(RedisChannelType.AI_ROUTE_RESULT, m);
    }

    @Override
    public void error(Long roomId, String jobId, String message) {
        Map<String, Object> m = basePayload(roomId, jobId);

        // 🔒 에러 저장 (Route 네임스페이스)
        redisAiService.saveError(ROUTE, roomId, jobId, message, m);

        m.put("type", "ERROR");
        m.put("message", message);

        Map<String, Object> front = toFrontStatusPayload(m);
        log.info("[AI-ROUTE][PUBLISH] ERROR → roomId={}, jobId={}, message={}, frontPayload={}",
                roomId, jobId, message, front);
        redisPublisher.publish(RedisChannelType.AI_ROUTE_STATUS, front);
    }

    @Override
    public void invalidated(Long roomId, String reason) {
        // 🔒 무효화 저장 (Route 네임스페이스)
        redisAiService.saveInvalidated(ROUTE, roomId, reason);

        Map<String, Object> m = new HashMap<>();
        m.put("type", "INVALIDATED");
        m.put("roomId", roomId);
        m.put("reason", reason);
        m.put("updatedAt", Instant.now().toString());

        Map<String, Object> front = toFrontStatusPayload(m);
        log.info("[AI-ROUTE][PUBLISH] INVALIDATED → roomId={}, reason={}, frontPayload={}",
                roomId, reason, front);
        redisPublisher.publish(RedisChannelType.AI_ROUTE_STATUS, front);
    }
}
