package com.B108.tripwish.domain.kakaomap.service;

import java.util.List;

import com.B108.tripwish.domain.kakaomap.dto.KakaoAddressDto;
import com.B108.tripwish.domain.kakaomap.dto.KakaoPlaceDto;

public interface KakaomapService {
  List<KakaoPlaceDto> searchPlaces(String keyword);

  KakaoAddressDto getAddressFromCoords(double lat, double lng);
}
