package com.B108.tripwish.domain.place.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlaceDto {
  private Long placeId;
  private String placeName;
  private String placeImg;
  private String category;
  private String address;
  private Double latitude;
  private Double longitude;
  private Boolean isLiked;
  private Boolean isWanted;
}
