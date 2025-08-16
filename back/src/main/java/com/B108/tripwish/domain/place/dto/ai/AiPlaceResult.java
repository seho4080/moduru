package com.B108.tripwish.domain.place.dto.ai;

import java.util.List;

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
public class AiPlaceResult {
  private List<Long> result;
}
