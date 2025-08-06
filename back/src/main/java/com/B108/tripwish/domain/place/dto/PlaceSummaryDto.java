package com.B108.tripwish.domain.place.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class PlaceSummaryDto {
    private Long id;
    private String name;
    private String address;
    private String imageUrl;
}
