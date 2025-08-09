package com.B108.tripwish.domain.kakaomap.controller;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.B108.tripwish.domain.kakaomap.dto.KakaoPlaceDto;
import com.B108.tripwish.domain.kakaomap.service.KakaomapService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;

@RestController
@RequestMapping("/kakao")
public class KakaomapController {

  private final KakaomapService kakaoMapService;

  public KakaomapController(KakaomapService kakaoMapService) {
    this.kakaoMapService = kakaoMapService;
  }

  @Operation(
      summary = "장소 검색 (카카오맵 API)",
      description = "키워드로 장소를 검색하고, 카카오맵에서 결과를 가져옵니다.",
      responses = {
        @ApiResponse(responseCode = "200", description = "장소 검색 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청", content = @Content),
        @ApiResponse(responseCode = "500", description = "서버 오류", content = @Content)
      })
  @GetMapping("/search")
  public List<KakaoPlaceDto> search(@RequestParam String keyword) {
    String decodedKeyword = URLDecoder.decode(keyword, StandardCharsets.UTF_8);
    return kakaoMapService.searchPlaces(decodedKeyword);
  }
}
