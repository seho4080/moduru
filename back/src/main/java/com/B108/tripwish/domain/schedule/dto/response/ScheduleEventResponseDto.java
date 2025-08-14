package com.B108.tripwish.domain.schedule.dto.response;

import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleEventResponseDto {
  private Long wantId;
  private String placeImg;
  private String placeName;

  @Schema(type = "string", pattern = "HH:mm", example = "09:00")
  @JsonFormat(pattern = "HH:mm")
  private LocalTime startTime;

  @Schema(type = "string", pattern = "HH:mm", example = "09:00")
  @JsonFormat(pattern = "HH:mm")
  private LocalTime endTime;

  private int eventOrder;
  private Double lat;
  private Double lng;
  private Integer nextTravelTime;
}
