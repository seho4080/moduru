package com.B108.tripwish.domain.room.dto.response;

import java.util.List;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlaceWantListResponseDto {
  private List<PlaceWantDto> placesWant;
}
