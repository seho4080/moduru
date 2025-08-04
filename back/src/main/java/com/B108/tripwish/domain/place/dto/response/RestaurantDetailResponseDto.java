package com.B108.tripwish.domain.place.dto.response;

import lombok.*;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantDetailResponseDto implements CategoryDetailResponseDto{
    private String description;
    private String descriptionShort;
    private String tel;
    private String homepage;
    private String businessHours;
    private String restDate;
    private String parking;
    private String price;
    private List<String> menus;

}
