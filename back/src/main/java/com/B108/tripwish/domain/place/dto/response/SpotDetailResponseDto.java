package com.B108.tripwish.domain.place.dto.response;

import lombok.*;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpotDetailResponseDto implements CategoryDetailResponseDto {
  private String description;
  private String descriptionShort;
  private String infoCenter;
  private String homepage;
  private String businessHours;
  private String restDate;
  private String parking;
  private String price;
}
