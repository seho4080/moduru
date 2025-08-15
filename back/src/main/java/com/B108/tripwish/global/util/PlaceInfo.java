package com.B108.tripwish.global.util;

import lombok.*;

@Getter
@Builder
@AllArgsConstructor
public class PlaceInfo {
    private String name;
    private String imageUrl;    // 커스텀 장소는 null
    private String address;
    private Long categoryId;
    private String category;    // 커스텀 장소는 null
    private Double lat;
    private Double lng;
}