package com.B108.tripwish.infra.ai;

import com.B108.tripwish.domain.route.dto.ai.AiRouteResult;
import com.B108.tripwish.domain.route.dto.ai.AiRouteSpec;
import com.B108.tripwish.domain.route.service.RouteAiGateway;
import com.B108.tripwish.domain.schedule.dto.ai.AiScheduleResult;
import com.B108.tripwish.domain.schedule.dto.ai.AiScheduleSpec;
import com.B108.tripwish.domain.schedule.service.ScheduleAiGateway;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class HttpGateway implements RouteAiGateway, ScheduleAiGateway {
    private final WebClient aiWebClient;

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
}
