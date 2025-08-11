package com.B108.tripwish.domain.kakaomap.service;

import com.B108.tripwish.domain.kakaomap.dto.KakaoAddressDto;
import com.B108.tripwish.domain.kakaomap.dto.KakaoPlaceDto;

import java.util.List;

public interface KakaomapService {
    List<KakaoPlaceDto> searchPlaces(String keyword);

    KakaoAddressDto getAddressFromCoords(double lat, double lng);
}
