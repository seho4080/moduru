package com.B108.tripwish.domain.route.service;

import com.B108.tripwish.domain.route.dto.ai.AiRouteResult;
import com.B108.tripwish.domain.route.dto.ai.AiRouteSpec;

public interface RouteAiGateway {
    AiRouteResult recommendRoute(AiRouteSpec spec);
}
