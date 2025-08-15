package com.B108.tripwish.infra.kakao.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.*;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL) // null 필드는 전송 제외
public class KakaoWayPointRequestDto {

  private Coord origin; // 필수 (x=경도, y=위도)
  private Coord destination; // 필수 (x=경도, y=위도)

  @JsonInclude(JsonInclude.Include.NON_EMPTY) // 빈 리스트면 전송 생략
  private List<Waypoint> waypoints; // 선택(최대 30)

  // ===== 옵션 =====
  private Priority priority; // RECOMMEND(default), TIME, DISTANCE

  private Integer roadevent; // 0(기본)=전면통제 반영, 1=출/도착지 주변 무시, 2=모든 전면통제 무시
  private Boolean alternatives; // 대안 경로 포함 여부 (기본 false)

  @JsonProperty("road_details")
  private Boolean roadDetails; // 도로 상세 포함 여부 (기본 false)

  private Boolean summary; // 요약만 받을지 여부 (기본 false)

  // ===== 좌표/경유지 =====
  @Getter
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  @JsonInclude(JsonInclude.Include.NON_NULL)
  public static class Coord {
    private String name; // 선택
    private double x; // 경도(lng)
    private double y; // 위도(lat)
    private Integer angle; // 선택(0~360) - origin에서만 의미
  }

  @Getter
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  @JsonInclude(JsonInclude.Include.NON_NULL)
  public static class Waypoint {
    private String name; // 선택
    private double x; // 경도
    private double y; // 위도
  }

  // ===== Enums =====
  public enum Priority {
    RECOMMEND,
    TIME,
    DISTANCE
  }
}
