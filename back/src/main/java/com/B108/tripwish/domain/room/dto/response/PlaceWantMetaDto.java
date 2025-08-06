package com.B108.tripwish.domain.room.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PlaceWantMetaDto {
    private String placeName;
    private String placeImg;
    private String address;
    private String category;
    private Double lat;
    private Double lng;
    private Boolean isLiked;
}

