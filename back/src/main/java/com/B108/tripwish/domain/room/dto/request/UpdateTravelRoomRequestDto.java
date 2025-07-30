package com.B108.tripwish.domain.room.dto.request;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTravelRoomRequestDto {
  private String title; // 방 이름
  private String region; // 지역
  private LocalDate startDate; // 시작일
  private LocalDate endDate; // 종료일
}
