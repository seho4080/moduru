package com.B108.tripwish.domain.schedule.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AiScheduleRequestDto {
    private Long roomId;
    private List<Long> placeList; // 희망장소 ID 리스트
    private int days; // 여행 일 수?
}
