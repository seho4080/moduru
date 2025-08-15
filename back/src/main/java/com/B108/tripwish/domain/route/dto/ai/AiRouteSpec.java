package com.B108.tripwish.domain.route.dto.ai;

import com.B108.tripwish.domain.schedule.dto.ai.AiScheduleResult;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiRouteSpec {
    private List<AiPlaceInfoDto> placeList;
    private int days;

    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    @Getter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class AiPlaceInfoDto{
        private Long id;
        private Long categoryId;
        private Double lat;
        private Double lng;
    }

}
