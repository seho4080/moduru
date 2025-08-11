package com.B108.tripwish.websocket.service;

import com.B108.tripwish.domain.route.dto.response.RouteResultResponseDto;
import com.B108.tripwish.websocket.dto.redis.DayScheduleRedisDto;
import com.B108.tripwish.websocket.dto.request.ScheduleEventMessageRequestDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RedisScheduleService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper; // 주입 (JavaTimeModule 등록된 mapper)

    private HashOperations<String, String, Object> ops() {
        return redisTemplate.opsForHash();
    }

    public void saveSchedule(String redisKey, Integer day, DayScheduleRedisDto scheduleDto) {
        ops().put(redisKey, day.toString(), scheduleDto);
    }

    // 전체 조회: Object → DayScheduleRedisDto 변환
    public Map<String, DayScheduleRedisDto> getSchedule(String redisKey) {
        Map<String, Object> raw = ops().entries(redisKey);
        return raw.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> objectMapper.convertValue(e.getValue(), DayScheduleRedisDto.class)
                ));
    }

    // 단건 조회: Object → DayScheduleRedisDto 변환
    public DayScheduleRedisDto getScheduleByDay(String redisKey, Integer day) {
        Object raw = ops().get(redisKey, day.toString());
        return (raw == null) ? null : objectMapper.convertValue(raw, DayScheduleRedisDto.class);
    }

    public void deleteSchedule(String redisKey) {
        redisTemplate.delete(redisKey);
    }

    public String getRedisKey(Long roomId) {
        return "schedule:" + roomId;
    }

    public Integer getDraftVersion(Long roomId, Integer day) {
        String key = getRedisKey(roomId) + ":versions";
        Object raw = ops().get(key, day.toString());
        return (raw != null) ? Integer.valueOf(raw.toString()) : null;
    }

    public void clearVersions(Long roomId) {
        redisTemplate.delete(getRedisKey(roomId) + ":versions");
    }

    public void applyTravelTimesFromResult(RouteResultResponseDto result) {
        String redisKey = getRedisKey(result.getRoomId());
        Integer day = result.getDay();

        DayScheduleRedisDto existing = getScheduleByDay(redisKey, day);
        if (existing == null || existing.getEvents() == null || existing.getEvents().isEmpty()) {
            return; // 저장할 본문이 없으면 스킵
        }

        // (fromId,toId) -> duration(min) 맵 구성
        Map<String, Integer> legMinByPair = result.getLegs().stream()
                .collect(Collectors.toMap(
                        l -> pairKey(l.getFromWantId(), l.getToWantId()),
                        l -> (int) Math.round(l.getDurationSec() / 60.0) // 초→분 반올림
                ));

        // 이벤트 순서대로 nextTravelTime 채우기 (마지막 이벤트는 null)
        List<ScheduleEventMessageRequestDto> updated = new ArrayList<>(existing.getEvents());
        for (int i = 0; i < updated.size(); i++) {
            ScheduleEventMessageRequestDto cur = updated.get(i);
            if (i == updated.size() - 1) {
                cur.setNextTravelTime(null);
                continue;
            }
            Long fromId = cur.getWantId();
            Long toId   = updated.get(i + 1).getWantId();
            Integer minutes = legMinByPair.get(pairKey(fromId, toId));
            cur.setNextTravelTime(minutes); // 없으면 null 그대로(경로 없음 등)
        }

        // ✅ 버전 그대로 유지!
        DayScheduleRedisDto toSave = DayScheduleRedisDto.builder()
                .date(existing.getDate())
                .version(existing.getVersion())
                .events(updated)
                .build();

        saveSchedule(redisKey, day, toSave);
    }

    private static String pairKey(Long fromId, Long toId) {
        return fromId + ">" + toId;
    }

}