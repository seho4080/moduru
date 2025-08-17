package com.B108.tripwish.websocket.dto.response;

import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class ScheduleEventMessageResponseDto {
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
}
