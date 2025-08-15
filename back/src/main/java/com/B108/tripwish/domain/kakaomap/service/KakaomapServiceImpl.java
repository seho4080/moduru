package com.B108.tripwish.domain.kakaomap.service;

import java.util.ArrayList;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.B108.tripwish.domain.kakaomap.dto.KakaoAddressDto;
import com.B108.tripwish.domain.kakaomap.dto.KakaoPlaceDto;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class KakaomapServiceImpl implements KakaomapService {

  @Value("${kakao.api.key}")
  private String kakaoApiKey;

  @Override
  public List<KakaoPlaceDto> searchPlaces(String keyword) {
    List<KakaoPlaceDto> resultList = new ArrayList<>();

    try {
      String url =
          "https://dapi.kakao.com/v2/local/search/keyword.json?query=" + keyword + "&size=5";

      HttpHeaders headers = new HttpHeaders();
      headers.set("Authorization", "KakaoAK " + kakaoApiKey);
      HttpEntity<String> entity = new HttpEntity<>(headers);

      RestTemplate restTemplate = new RestTemplate();
      ResponseEntity<String> response =
          restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

      JSONObject json = new JSONObject(response.getBody());
      JSONArray documents = json.getJSONArray("documents");

      for (int i = 0; i < documents.length(); i++) {
        JSONObject place = documents.getJSONObject(i);
        resultList.add(
            new KakaoPlaceDto(
                place.getString("id"),
                place.getString("place_name"),
                place.optString("address_name", ""),
                place.optString("road_address_name", ""),
                place.getString("y"),
                place.getString("x")));
      }
    } catch (Exception e) {
      log.error("KakaoMap API 호출 중 예외 발생", e);
    }

    return resultList;
  }

  @Override
  public KakaoAddressDto getAddressFromCoords(double lat, double lng) {
    try {
      String url = "https://dapi.kakao.com/v2/local/geo/coord2address.json?x=" + lng + "&y=" + lat;

      HttpHeaders headers = new HttpHeaders();
      headers.set("Authorization", "KakaoAK " + kakaoApiKey);
      HttpEntity<String> entity = new HttpEntity<>(headers);

      RestTemplate restTemplate = new RestTemplate();
      ResponseEntity<String> response =
          restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

      JSONObject json = new JSONObject(response.getBody());
      JSONArray documents = json.getJSONArray("documents");

      if (documents.length() > 0) {
        JSONObject address = documents.getJSONObject(0).getJSONObject("address");
        String fullAddress = address.getString("address_name");
        return new KakaoAddressDto(fullAddress);
      }
    } catch (Exception e) {
      log.error("좌표 → 주소 변환 실패", e);
    }

    return new KakaoAddressDto(""); // fallback
  }
}
