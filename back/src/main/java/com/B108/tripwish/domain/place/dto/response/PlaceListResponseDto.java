package com.B108.tripwish.domain.place.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PlaceListResponseDto {
  private List<PlaceResponseDto> places;
}
