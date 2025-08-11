package com.B108.tripwish.websocket.dto.response;

import lombok.*;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TravelTimeResultMessageResponseDto {
    private Long roomId;
    private Integer day;
    private String mode;                 // "walking" | "transit"
    private long totalDistanceMeters;
    private long totalDurationMinutes;   // ✅ 분 단위
    private List<LegResponseDto> legs;
}
