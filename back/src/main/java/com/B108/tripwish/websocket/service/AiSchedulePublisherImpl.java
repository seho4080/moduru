package com.B108.tripwish.websocket.service;

import com.B108.tripwish.domain.schedule.websocket.AiSchedulePublisher;
import com.B108.tripwish.websocket.dto.response.AiRecommendBroadcastDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiSchedulePublisherImpl implements AiSchedulePublisher {

    private final RedisPublisher redisPublisher;
    private final RedisAiService redisAiService;
    private final com.fasterxml.jackson.databind.ObjectMapper om;

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
        // type -> status
        Object typeVal = front.remove("type");
        if (typeVal != null) front.put("status", typeVal.toString());
        // days 제거
        front.remove("days");
        return front;
    }

    @Override
    public void started(Long roomId, String jobId, int days) {
        Map<String, Object> m = basePayload(roomId, jobId);
        // 저장/내부 처리는 기존대로 type 사용
        redisAiService.saveStarted(roomId, jobId, days, m);

        m.put("type", "STARTED");
        m.put("days", days);

        Map<String, Object> front = toFrontStatusPayload(m);
        log.info("[AI-SCHEDULE][PUBLISH] STARTED → roomId={}, jobId={}, days={}, frontPayload={}", roomId, jobId, days, front);
        redisPublisher.publish(RedisChannelType.AI_SCHEDULE_STATUS, front);
    }

    @Override
    public void progress(Long roomId, String jobId, int progress) {
        Map<String, Object> m = basePayload(roomId, jobId);
        redisAiService.saveProgressThrottled(roomId, jobId, progress, m);

        m.put("type", "PROGRESS");
        m.put("progress", progress);

        Map<String, Object> front = toFrontStatusPayload(m);
        log.info("[AI-SCHEDULE][PUBLISH] PROGRESS → roomId={}, jobId={}, progress={}, frontPayload={}", roomId, jobId, progress, front);
        redisPublisher.publish(RedisChannelType.AI_SCHEDULE_STATUS, front);
    }

    @Override
    public void done(Long roomId, String jobId, AiRecommendBroadcastDto result) {
        Map<String, Object> base = basePayload(roomId, jobId);

        // 상태 채널
        Map<String, Object> s = new HashMap<>(base);
        s.put("type", "DONE");
        Map<String, Object> frontStatus = toFrontStatusPayload(s);

        // ★ 프론트로 보내는 STATUS 페이로드를 JSON으로
        try {
            String statusJson = om.writerWithDefaultPrettyPrinter().writeValueAsString(frontStatus);
            log.info("[AI-SCHEDULE][PUBLISH] DONE(status) JSON:\n{}", statusJson);
        } catch (Exception ignore) {}
        redisPublisher.publish(RedisChannelType.AI_SCHEDULE_STATUS, frontStatus);

        // 결과 저장
        redisAiService.saveDone(roomId, jobId, result, base);

        // 결과 채널
        Map<String, Object> m = new HashMap<>(base);
        m.put("type", "RESULT");
        m.put("result", result);

        // ★ 프론트로 보내는 RESULT 페이로드를 JSON으로
        try {
            String resultJson = om.writerWithDefaultPrettyPrinter().writeValueAsString(m);
            log.info("[AI-SCHEDULE][PUBLISH] RESULT(data) JSON:\n{}", resultJson);
        } catch (Exception ignore) {}
        redisPublisher.publish(RedisChannelType.AI_SCHEDULE_RESULT, m);
    }

    @Override
    public void error(Long roomId, String jobId, String message) {
        Map<String, Object> m = basePayload(roomId, jobId);
        redisAiService.saveError(roomId, jobId, message, m);

        m.put("type", "ERROR");
        m.put("message", message);

        Map<String, Object> front = toFrontStatusPayload(m);
        log.info("[AI-SCHEDULE][PUBLISH] ERROR → roomId={}, jobId={}, message={}, frontPayload={}", roomId, jobId, message, front);
        redisPublisher.publish(RedisChannelType.AI_SCHEDULE_STATUS, front);
    }

    @Override
    public void invalidated(Long roomId, String reason) {
        redisAiService.saveInvalidated(roomId, reason);

        Map<String, Object> m = new HashMap<>();
        m.put("type", "INVALIDATED");
        m.put("roomId", roomId);
        m.put("reason", reason);
        m.put("updatedAt", Instant.now().toString());

        Map<String, Object> front = toFrontStatusPayload(m);
        log.info("[AI-SCHEDULE][PUBLISH] INVALIDATED → roomId={}, reason={}, frontPayload={}", roomId, reason, front);
        redisPublisher.publish(RedisChannelType.AI_SCHEDULE_STATUS, front);
    }
}
