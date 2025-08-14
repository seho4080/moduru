package com.B108.tripwish.domain.schedule.dto.response;

import java.util.List;
import java.util.Map;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleConflictResponseDto {
  @Schema(description = "day → version", example = "{\"1\":6,\"2\":4}")
  private Map<Integer, Integer> latestVersions;

  private List<ScheduleListResponseDto> latestSchedules;
}
