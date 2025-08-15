package com.B108.tripwish.domain.route.dto.request;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiRouteRequestDto {
  private Long roomId;
  private List<Long> placeList;
  private int day;
}
