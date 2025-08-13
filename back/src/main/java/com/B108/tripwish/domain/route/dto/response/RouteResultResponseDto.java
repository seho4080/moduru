package com.B108.tripwish.domain.route.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteResultResponseDto {

    private Long roomId;                 // 방 ID
    private Integer day;                 // 일차
    private String mode;                 // "walking" | "transit"
    private long totalDistanceMeters;    // 총 이동 거리
    private long totalDurationSec;       // 총 소요 시간(초)
    private List<LegResponseDto> legs;   // 구간별 정보
    private String polyline;             // 옵션: 지도 경로 폴리라인

    public static RouteResultResponseDto empty() {
        return RouteResultResponseDto.builder()
                .mode("walking")
                .totalDistanceMeters(0)
                .totalDurationSec(0)
                .legs(List.of())
                .build();
    }
}
