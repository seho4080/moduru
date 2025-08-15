package com.B108.tripwish.domain.schedule.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AiSnapshotResponseDto {
    private Long roomId;
    private String status;     // IDLE | STARTED | PROGRESS | DONE | ERROR | INVALIDATED
    private String jobId;
    private Integer progress;  // PROGRESS일 때만
    private String message;    // ERROR일 때만
    private String reason;     // INVALIDATED일 때만
    private Instant updatedAt;
    private Object result;     // DONE일 때 직렬화된 결과 DTO(Map or 구체 DTO)


}
