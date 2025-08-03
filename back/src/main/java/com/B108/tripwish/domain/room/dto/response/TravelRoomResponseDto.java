package com.B108.tripwish.domain.room.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.B108.tripwish.domain.room.entity.TravelRoom;

import lombok.*;

@Getter
@Setter
@Builder
public class TravelRoomResponseDto {
  private Long travelRoomId; // 방 ID
  private String title; // 방 제목
  private String region; // 지역
  private LocalDate startDate; // 시작 날짜
  private LocalDate endDate; // 끝 날짜
  private LocalDateTime createdAt; // 생성일시

  public static TravelRoomResponseDto from(TravelRoom room) {
    return TravelRoomResponseDto.builder()
        .travelRoomId(room.getId())
        .title(room.getTitle())
        .region(room.getRegion())
        .startDate(room.getStartDate())
        .endDate(room.getEndDate())
        .createdAt(room.getCreatedAt())
        .build();
  }
}
