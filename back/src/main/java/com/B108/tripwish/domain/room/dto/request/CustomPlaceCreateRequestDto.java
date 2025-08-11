package com.B108.tripwish.domain.room.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
public class CustomPlaceCreateRequestDto {
    @Schema(description = "커스텀 장소가 속한 여행 방 ID", example = "1")
    private Long roomId;

    @Schema(description = "장소 이름", example = "나만의 커피숍")
    private String name;

    @Schema(description = "위도 (Latitude)", example = "37.5665")
    private Double lat;

    @Schema(description = "경도 (Longitude)", example = "126.9780")
    private Double lng;
    private String address;
}
