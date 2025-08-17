package com.B108.tripwish.websocket.service;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

// 저장 유틸 (간단 버전)
@Component
@RequiredArgsConstructor
public class RedisAiService {
  private final StringRedisTemplate redis;
  private final ObjectMapper om;

  private static final int JOB_HISTORY_LIMIT = 20;
  private static final Duration JOB_TTL = Duration.ofHours(48);

  private String ns(AiTaskType t) {
    return "ai:" + t.getCode() + ":";
  }

  private String roomLatestJobKey(AiTaskType t, Long roomId) {
    return ns(t) + "room:" + roomId + ":latestJob";
  }

  private String roomStatusKey(AiTaskType t, Long roomId) {
    return ns(t) + "room:" + roomId + ":status";
  }

  private String roomResultKey(AiTaskType t, Long roomId) {
    return ns(t) + "room:" + roomId + ":result";
  }

  private String roomJobsKey(AiTaskType t, Long roomId) {
    return ns(t) + "room:" + roomId + ":jobs";
  }

  private String jobStatusKey(AiTaskType t, String jobId) {
    return ns(t) + "job:" + jobId + ":status";
  }

  private String jobResultKey(AiTaskType t, String jobId) {
    return ns(t) + "job:" + jobId + ":result";
  }

  public void saveStarted(
      AiTaskType t, Long roomId, String jobId, int days, Map<String, Object> base) {
    try {
      Map<String, Object> status = new HashMap<>(base);
      status.put("type", "STARTED");
      status.put("days", days);
      status.putIfAbsent("updatedAt", Instant.now().toString());

      String statusJson = om.writeValueAsString(status);

      redis.opsForValue().set(roomLatestJobKey(t, roomId), jobId);
      redis.opsForValue().set(roomStatusKey(t, roomId), statusJson);
      redis.opsForList().leftPush(roomJobsKey(t, roomId), jobId);
      redis.opsForList().trim(roomJobsKey(t, roomId), 0, JOB_HISTORY_LIMIT - 1);

      redis.opsForValue().set(jobStatusKey(t, jobId), statusJson, JOB_TTL);
    } catch (Exception ignored) {
    }
  }

  public void saveProgressThrottled(
      AiTaskType t, Long roomId, String jobId, int progress, Map<String, Object> base) {
    try {
      String prevJson = redis.opsForValue().get(roomStatusKey(t, roomId));
      int prevProg = -1;
      long prevTs = 0L;
      if (prevJson != null) {
        Map<?, ?> prev = om.readValue(prevJson, Map.class);
        Object p = prev.get("progress");
        if (p instanceof Number n) prevProg = n.intValue();
        Object time = prev.get("updatedAt");
        if (time != null) {
          try {
            prevTs = Instant.parse(time.toString()).toEpochMilli();
          } catch (Exception ignored) {
          }
        }
      }
      long now = Instant.now().toEpochMilli();
      boolean deltaEnough = prevProg < 0 || progress - prevProg >= 5;
      boolean timeEnough = prevTs == 0 || (now - prevTs) >= 2000;
      if (!(deltaEnough || timeEnough)) return;

      Map<String, Object> status = new HashMap<>(base);
      status.put("type", "PROGRESS");
      status.put("progress", progress);
      status.put("updatedAt", Instant.now().toString());

      String statusJson = om.writeValueAsString(status);
      redis.opsForValue().set(roomStatusKey(t, roomId), statusJson);
      redis.opsForValue().set(jobStatusKey(t, jobId), statusJson, JOB_TTL);
    } catch (Exception ignored) {
    }
  }

  public void saveDone(
      AiTaskType t, Long roomId, String jobId, Object resultDto, Map<String, Object> base) {
    try {
      Map<String, Object> status = new HashMap<>(base);
      status.put("type", "DONE");
      status.putIfAbsent("updatedAt", Instant.now().toString());

      String statusJson = om.writeValueAsString(status);
      String resultJson = om.writeValueAsString(resultDto);

      redis.opsForValue().set(roomStatusKey(t, roomId), statusJson);
      redis.opsForValue().set(roomResultKey(t, roomId), resultJson);

      redis.opsForValue().set(jobStatusKey(t, jobId), statusJson, JOB_TTL);
      redis.opsForValue().set(jobResultKey(t, jobId), resultJson, JOB_TTL);
    } catch (Exception ignored) {
    }
  }

  public void saveError(
      AiTaskType t, Long roomId, String jobId, String message, Map<String, Object> base) {
    try {
      Map<String, Object> status = new HashMap<>(base);
      status.put("type", "ERROR");
      status.put("message", message);
      status.putIfAbsent("updatedAt", Instant.now().toString());

      String statusJson = om.writeValueAsString(status);
      redis.opsForValue().set(roomStatusKey(t, roomId), statusJson);
      redis.opsForValue().set(jobStatusKey(t, jobId), statusJson, JOB_TTL);
    } catch (Exception ignored) {
    }
  }

  public void saveInvalidated(AiTaskType t, Long roomId, String reason) {
    try {
      Map<String, Object> status =
          Map.of(
              "type",
              "INVALIDATED",
              "roomId",
              roomId,
              "reason",
              reason,
              "updatedAt",
              Instant.now().toString());
      String statusJson = om.writeValueAsString(status);
      redis.opsForValue().set(roomStatusKey(t, roomId), statusJson);
    } catch (Exception ignored) {
    }
  }

  // ===== 조회 =====
  public Optional<String> getLatestJobId(AiTaskType t, Long roomId) {
    return Optional.ofNullable(redis.opsForValue().get(roomLatestJobKey(t, roomId)));
  }

  public Optional<String> getRoomStatus(AiTaskType t, Long roomId) {
    return Optional.ofNullable(redis.opsForValue().get(roomStatusKey(t, roomId)));
  }

  public Optional<String> getRoomResult(AiTaskType t, Long roomId) {
    return Optional.ofNullable(redis.opsForValue().get(roomResultKey(t, roomId)));
  }

  public Optional<String> getJobResult(AiTaskType t, String jobId) {
    return Optional.ofNullable(redis.opsForValue().get(jobResultKey(t, jobId)));
  }

  // === 기존 무타입 메서드(하위호환, 일정용 기본 가정) ===
  public void saveStarted(Long roomId, String jobId, int days, Map<String, Object> base) {
    saveStarted(AiTaskType.SCHEDULE, roomId, jobId, days, base);
  }

  public void saveProgressThrottled(
      Long roomId, String jobId, int progress, Map<String, Object> base) {
    saveProgressThrottled(AiTaskType.SCHEDULE, roomId, jobId, progress, base);
  }

  public void saveDone(Long roomId, String jobId, Object resultDto, Map<String, Object> base) {
    saveDone(AiTaskType.SCHEDULE, roomId, jobId, resultDto, base);
  }

  public void saveError(Long roomId, String jobId, String message, Map<String, Object> base) {
    saveError(AiTaskType.SCHEDULE, roomId, jobId, message, base);
  }

  public void saveInvalidated(Long roomId, String reason) {
    saveInvalidated(AiTaskType.SCHEDULE, roomId, reason);
  }

  public Optional<String> getLatestJobId(Long roomId) {
    return getLatestJobId(AiTaskType.SCHEDULE, roomId);
  }

  public Optional<String> getRoomStatus(Long roomId) {
    return getRoomStatus(AiTaskType.SCHEDULE, roomId);
  }

  public Optional<String> getRoomResult(Long roomId) {
    return getRoomResult(AiTaskType.SCHEDULE, roomId);
  }

  public Optional<String> getJobResult(String jobId) {
    return getJobResult(AiTaskType.SCHEDULE, jobId);
  }
}
