package com.B108.tripwish.domain.kakaomap.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class KakaoPlaceDto {
    private String id;
    private String name;
    private String addressName;
    private String roadAddressName;
    private String lat;
    private String lng;
}
