package com.B108.tripwish.domain.place.dto.response;

import java.util.List;

import lombok.*;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantDetailResponseDto implements CategoryDetailResponseDto {
  private String description;
  private String descriptionShort;
  private String tel;
  private String homepage;
  private String businessHours;
  private String restDate;
  private String parking;
  private List<String> menus;
}
