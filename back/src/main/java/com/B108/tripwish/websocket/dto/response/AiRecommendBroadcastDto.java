package com.B108.tripwish.websocket.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiRecommendBroadcastDto {
  private Long roomId;
  private List<ScheduleInfo> schedule;

  @Getter
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  public static class ScheduleInfo {
    private int day;
    private List<RouteDto> legs;
  }

  @Getter
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  public static class RouteDto {
    private Long wantId;
    private String placeImg;
    private String placeName;
    private String transport;
    private int eventOrder;
    private Double lat;
    private Double lng;
    private Integer nextTravelTime;
  }
}
