package com.B108.tripwish.domain.place.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PlaceDto {
    private Long placeId;
    private String name;
    private String imageUrl;
    private String category;
    private Boolean isLiked;
    private Boolean isWanted;

    // 장소ID, 장소명, 장소사진, 좋아요여부, 희망장소여부
    public PlaceDto(Long placeId, String name, String imageUrl, Boolean isLiked, Boolean isWanted) {
        this.placeId = placeId;
        this.name = name;
        this.imageUrl = imageUrl;
        this.isLiked = isLiked;
        this.isWanted = isWanted;
    }

}