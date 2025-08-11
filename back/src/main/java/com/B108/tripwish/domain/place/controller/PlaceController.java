package com.B108.tripwish.domain.place.controller;

import java.util.List;

import com.B108.tripwish.domain.place.dto.response.PlaceBucketsResponseDto;
import com.B108.tripwish.global.common.dto.RegionResponseDto;
import com.B108.tripwish.global.exception.ErrorResponse;
import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.place.dto.response.PlaceDetailResponseDto;
import com.B108.tripwish.domain.place.dto.response.PlaceListResponseDto;
import com.B108.tripwish.domain.place.dto.response.PlaceResponseDto;
import com.B108.tripwish.domain.place.service.PlaceService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/places/{roomId}")
public class PlaceController {

  private final PlaceService placeService;

  // 장소 목록 조회
  @Operation(
          summary = "지역 기반 기본 장소 목록 조회 (카테고리별 + 내가 좋아요한 장소 버킷)",
          description = """
      지역 내 장소를 카테고리별(restaurant/spot/festival/commons)과 
      myPlaces(내가 좋아요한 모든 장소)로 한 번에 반환합니다.
      장소가 없으면 각 버킷은 빈 배열로 반환됩니다.
    """,
          responses = {
                  @ApiResponse(responseCode = "200", description = "장소 목록 조회 성공"),
                  @ApiResponse(responseCode = "401", description = "인증 실패 (AccessToken 누락/유효하지 않음/만료됨)"),
                  @ApiResponse(
                          responseCode = "404",
                          description = "존재하지 않는 roomId 또는 해당 room에 연결된 지역을 찾을 수 없음",
                          content = @Content(schema = @Schema(implementation = ErrorResponse.class))
                  ),
                  @ApiResponse(
                          responseCode = "500",
                          description = "서버 내부 오류",
                          content = @Content(schema = @Schema(implementation = ErrorResponse.class))
                  )
          }
  )
  @GetMapping("/buckets")
  public ResponseEntity<PlaceBucketsResponseDto> getPlacesBuckets(
          @AuthenticationPrincipal CustomUserDetails user,
          @PathVariable Long roomId) {
    return ResponseEntity.ok(placeService.getPlacesBuckets(user, roomId));
  }



  @Operation(
      summary = "AI 기반 장소 목록 조회",
      description =
          "사용자가 입력한 자연어 검색어를 기반으로 AI가 장소를 분석하여 반환합니다. " + "해당 검색은 방 ID에 연결된 여행 지역 내에서만 수행됩니다.",
      responses = {
        @ApiResponse(responseCode = "200", description = "장소 검색 결과 조회 성공"),
        @ApiResponse(
            responseCode = "400",
            description = "검색어(keyword)가 누락되었거나 잘못된 요청입니다.",
            content = @Content),
        @ApiResponse(
            responseCode = "404",
            description = "해당 roomId 또는 검색 조건에 해당하는 장소가 없습니다.",
            content = @Content),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류", content = @Content)
      })
  @GetMapping("/ai-search")
  public ResponseEntity<PlaceListResponseDto> getAISearchPlaces(
      @PathVariable Long roomId, @RequestParam String keyword) {
    PlaceResponseDto sample =
        PlaceResponseDto.builder()
            .placeId(1L)
            .placeName("스타벅스 강남점")
            .placeImg("https://example.com/images/place1.jpg")
            .category("카페")
            .address("서울특별시 강남구 강남대로 584 (논현동)")
            .latitude(37.517235)
            .longitude(127.047325)
            .isLiked(true)
            .isWanted(false)
            .build();
    List<PlaceResponseDto> list = List.of(sample);
    PlaceListResponseDto response = new PlaceListResponseDto(list);

    return ResponseEntity.ok(response);
  }

  @Operation(
      summary = "장소 상세 정보 조회",
      description = "장소의 이미지, 장소명, 리뷰 태그, 주소, 및 장소에 해당하는 설명을 조회할 수 있습니다.",
      responses = {
        @ApiResponse(responseCode = "200", description = "장소 목록 조회 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 type 값 입력", content = @Content),
        @ApiResponse(
            responseCode = "404",
            description = "해당 장소의 세부정보를 찾을 수 없음",
            content = @Content),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류", content = @Content)
      })
  @GetMapping("/detail")
  public ResponseEntity<PlaceDetailResponseDto> getDetailPlace(
      @AuthenticationPrincipal CustomUserDetails user,
      @PathVariable Long roomId,
      @RequestParam Long placeId) {
    PlaceDetailResponseDto response = placeService.getPlaceDetail(user, roomId, placeId);
    return ResponseEntity.ok(response); // 200
  }





}
