package com.B108.tripwish.websocket.dto.response;

import java.time.LocalDate;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class ScheduleMessageResponseDto {
  private Long itemId;
  private String action; // MOVE, EDIT, DELETE
  private LocalDate date; // 여행 날짜
  private Integer day; // 몇번째 날인지
  private String startTime; // 시작 시간
  private String endTime; // 끝 시간
  private Integer orderIn; // 하루 내 장소 순서
  private String memo; // 메모
}
