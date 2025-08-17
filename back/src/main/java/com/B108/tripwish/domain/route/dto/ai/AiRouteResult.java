package com.B108.tripwish.domain.route.dto.ai;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiRouteResult {
  private int day;
  private List<RouteInfo> route;

  @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
  @Getter
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  public static class RouteInfo {
    private Long id;

    @JsonAlias("transport")
    private String transport;

    @JsonAlias("eventOrder")
    private Integer eventOrder;

    @JsonAlias("nextTravelTime")
    private Integer nextTravelTime;
  }
}
