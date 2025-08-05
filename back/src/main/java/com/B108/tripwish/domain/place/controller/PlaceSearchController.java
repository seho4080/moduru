package com.B108.tripwish.domain.place.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.place.dto.request.PlaceSearchRequest;
import com.B108.tripwish.domain.place.dto.response.PlaceListResponseDto;
import com.B108.tripwish.domain.place.service.PlaceSearchService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/places/search")
public class PlaceSearchController {

  private final PlaceSearchService placeSearchService;

  @Operation(
      summary = "검색어(키워드) 기반 장소 목록 조회",
      description = "사용자가 입력한 검색어를 기반으로 카카오맵에서 장소 목록을 조회하여 반환합니다. 방 ID를 기반으로 해당 지역 내에서만 검색이 가능합니다.",
      responses = {
        @ApiResponse(responseCode = "200", description = "장소 검색 결과 조회 성공"),
        @ApiResponse(
            responseCode = "400",
            description = "검색어(keyword)가 누락되었거나 잘못된 요청입니다.",
            content = @Content),
        @ApiResponse(responseCode = "401", description = "인증 실패 (AccessToken 누락 / 유효하지 않음 / 만료됨)"),
        @ApiResponse(
            responseCode = "404",
            description = "해당 roomId 또는 검색 조건에 해당하는 장소가 없습니다.",
            content = @Content),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류", content = @Content)
      })
  @PostMapping("/{roomId}")
  public ResponseEntity<PlaceListResponseDto> getSearchPlaces(
      @AuthenticationPrincipal CustomUserDetails user,
      @PathVariable Long roomId,
      @RequestBody PlaceSearchRequest request) {
    PlaceListResponseDto response = placeSearchService.searchPlaces(user, roomId, request);
    return ResponseEntity.ok(response);
  }
}
