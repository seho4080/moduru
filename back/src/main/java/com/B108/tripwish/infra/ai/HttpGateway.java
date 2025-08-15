package com.B108.tripwish.infra.ai;

import com.B108.tripwish.domain.place.dto.ai.AiPlaceResult;
import com.B108.tripwish.domain.place.dto.ai.AiPlaceSpec;
import com.B108.tripwish.domain.place.service.PlaceAiGateWay;
import com.B108.tripwish.domain.route.dto.ai.AiRouteResult;
import com.B108.tripwish.domain.route.dto.ai.AiRouteSpec;
import com.B108.tripwish.domain.route.service.RouteAiGateway;
import com.B108.tripwish.domain.schedule.dto.ai.AiScheduleResult;
import com.B108.tripwish.domain.schedule.dto.ai.AiScheduleSpec;
import com.B108.tripwish.domain.schedule.service.ScheduleAiGateway;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class HttpGateway implements RouteAiGateway, ScheduleAiGateway, PlaceAiGateWay {
    private final WebClient aiWebClient;
    private final ObjectMapper objectMapper;

    @Override
    public AiRouteResult recommendRoute(AiRouteSpec spec) {
        return aiWebClient.post()
                .uri("/recommend/route")
                .bodyValue(spec)
                .retrieve()
                .bodyToMono(AiRouteResult.class)
                .block(Duration.ofSeconds(120));
    }

    @Override
    public List<AiScheduleResult> recommendSchedule(AiScheduleSpec spec) {
        return aiWebClient.post()
                .uri("/recommend/schedule")
                .bodyValue(spec)
                .retrieve()
                .bodyToFlux(AiScheduleResult.class)
                .collectList()
                .block(Duration.ofSeconds(120));
    }

    @Override
    public AiPlaceResult recommendPlace(AiPlaceSpec spec) {
        String raw = aiWebClient.post()
                .uri("/recommend/places")
                .bodyValue(spec)
                .retrieve()
                .bodyToMono(String.class)
                .block(Duration.ofSeconds(120));

        log.debug("[AI raw] len={} head={}", (raw != null ? raw.length() : -1),
                raw != null ? raw.substring(0, Math.min(raw.length(), 200)) : "null");

        try {
            if (raw == null || raw.isBlank()) {
                return AiPlaceResult.builder().result(List.of()).build();
            }

            // 루트가 곧바로 배열/문자열인 경우도 처리
            char first = firstNonWs(raw);
            if (first == '[' || first == '"') {
                return AiPlaceResult.builder().result(normalizeIds(raw)).build();
            }

            JsonNode root = objectMapper.readTree(raw);

            // 1) 최상위 result
            List<Long> ids = normalizeIdsNode(root.path("result"));
            if (!ids.isEmpty()) return AiPlaceResult.builder().result(ids).build();

            // 2) 흔한 대안 키
            for (String k : List.of("ids", "result_ids", "place_ids")) {
                ids = normalizeIdsNode(root.path(k));
                if (!ids.isEmpty()) return AiPlaceResult.builder().result(ids).build();
            }

            // 3) data.result 패턴
            JsonNode data = root.path("data");
            if (!data.isMissingNode()) {
                ids = normalizeIdsNode(data.path("result"));
                if (!ids.isEmpty()) return AiPlaceResult.builder().result(ids).build();

                for (String k : List.of("ids", "result_ids", "place_ids")) {
                    ids = normalizeIdsNode(data.path(k));
                    if (!ids.isEmpty()) return AiPlaceResult.builder().result(ids).build();
                }
            }

            // 4) 어떤 키에도 안 맞음 → 빈 결과
            log.warn("[AI parse] No ids found in response. raw={}", raw);
            return AiPlaceResult.builder().result(List.of()).build();

        } catch (Exception e) {
            log.warn("[AI parse] failed to parse raw response", e);
            return AiPlaceResult.builder().result(List.of()).build();
        }
    }

    private char firstNonWs(String s) {
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (!Character.isWhitespace(c)) return c;
        }
        return '\0';
    }

    // 유연 파서: 배열 또는 문자열 "[1,2,3]" 모두 처리
    private List<Long> normalizeIdsNode(JsonNode r) {
        if (r == null || r.isNull() || r.isMissingNode()) return List.of();

        if (r.isArray()) {
            List<Long> out = new ArrayList<>();
            Set<Long> seen = new HashSet<>();
            r.forEach(n -> {
                Long v = n.isNumber() ? n.longValue() : parseLongSafe(n.asText());
                if (v != null && seen.add(v)) out.add(v);
            });
            return out;
        }

        if (r.isTextual()) {
            return normalizeIds(r.asText());
        }
        return List.of();
    }

    private List<Long> normalizeIds(String s) {
        if (s == null || s.isBlank()) return List.of();
        s = s.trim();
        if (s.startsWith("[") && s.endsWith("]")) s = s.substring(1, s.length() - 1);
        if (s.isBlank()) return List.of();

        String[] tokens = s.split(",");
        List<Long> out = new ArrayList<>(tokens.length);
        Set<Long> seen = new HashSet<>();
        for (String t : tokens) {
            Long id = parseLongSafe(t);
            if (id != null && seen.add(id)) out.add(id);
        }
        return out;
    }

    private Long parseLongSafe(String s) {
        if (s == null) return null;
        try { return Long.parseLong(s.trim()); } catch (Exception e) { return null; }
    }

}
