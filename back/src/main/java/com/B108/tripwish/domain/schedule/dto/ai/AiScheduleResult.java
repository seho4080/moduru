package com.B108.tripwish.domain.schedule.dto.ai;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
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
public class AiScheduleResult {

  private int day;

  @JsonProperty("route")
  @JsonFormat(with = JsonFormat.Feature.ACCEPT_SINGLE_VALUE_AS_ARRAY)
  private List<RouteInfo> route;

  @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
  @Getter
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  public static class RouteInfo {
    private Long id;

    private String transport;

    @JsonAlias("eventOrder")
    private Integer eventOrder;

    @JsonAlias("nextTravelTime")
    private Integer nextTravelTime;
  }
}
