package com.B108.tripwish.domain.place.dto.response;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import lombok.Getter;
import lombok.Setter;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
@Getter
@Setter
public class AiPlaceDto {
  private Long id;
  private String placeName;
  private String addressName;
  private String businessHours; // null일 수 있음
  private String description; // null일 수 있음

  // getter/setter
}
