package com.B108.tripwish.websocket.dto.response;

import com.B108.tripwish.domain.schedule.dto.response.ScheduleEventResponseDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleMessageResponseDto {
    private Long roomId;
    private int day;
    private LocalDate date;
    private List<ScheduleEventMessageResponseDto> events;
    private String senderId;
    private int draftVersion;
}
