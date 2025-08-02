package com.B108.tripwish.domain.place.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.B108.tripwish.domain.place.dto.response.PlaceDetailResponseDto;
import com.B108.tripwish.domain.place.dto.response.PlaceDto;
import com.B108.tripwish.domain.place.dto.response.PlaceListResponseDto;
import com.B108.tripwish.domain.place.dto.response.TagSummaryDto;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/places")
public class PlaceController {

  // 장소 목록 조회
  @Operation(
      summary = "지역 기반 기본 장소 목록 조회",
      description =
          "장소 검색 탭의 지역 기반 기본 장소 목록을 카테고리별(all, restaurant, cafe, attraction, stay, etc)로 조회합니다.",
      responses = {
        @ApiResponse(responseCode = "200", description = "장소 목록 조회 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 카테고리(type) 값 입력", content = @Content),
        @ApiResponse(
            responseCode = "404",
            description = "존재하지 않는 roomId이거나 해당 방의 장소가 없음",
            content = @Content),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류", content = @Content)
      })
  @GetMapping("/{roomId}")
  public ResponseEntity<PlaceListResponseDto> getAllPlaces(
      @PathVariable Long roomId, @RequestParam String category) {
    PlaceDto sample =
        PlaceDto.builder()
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
    List<PlaceDto> list = List.of(sample);
    PlaceListResponseDto response = new PlaceListResponseDto(list);

    return ResponseEntity.ok(response);
  }

  @Operation(
      summary = "검색어(키워드) 기반 장소 목록 조회",
      description = "사용자가 입력한 검색어를 기반으로 카카오맵에서 장소 목록을 조회하여 반환합니다. 방 ID를 기반으로 해당 지역 내에서만 검색이 가능합니다.",
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
  @GetMapping("/{roomId}/search")
  public ResponseEntity<PlaceListResponseDto> getSearchPlaces(
      @PathVariable Long roomId, @RequestParam String keyword) {
    PlaceDto sample =
        PlaceDto.builder()
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

    List<PlaceDto> list = List.of(sample);
    PlaceListResponseDto response = new PlaceListResponseDto(list);

    return ResponseEntity.ok(response);
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
  @GetMapping("/{roomId}/ai-search")
  public ResponseEntity<PlaceListResponseDto> getAISearchPlaces(
      @PathVariable Long roomId, @RequestParam String keyword) {
    PlaceDto sample =
        PlaceDto.builder()
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
    List<PlaceDto> list = List.of(sample);
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
  public ResponseEntity<PlaceDetailResponseDto> getDetailPlace(@RequestParam Long placeId) {
    PlaceDetailResponseDto sample =
        PlaceDetailResponseDto.builder()
            .placeImg("https://example.com/image.jpg")
            .placeName("성심당")
            .address("대전 중구 중앙로 56")
            .isLiked(true)
            .isWanted(false)
            .detailGPT(
                "{\n"
                    + "  \"description\": \"이곳은 대전의 명물 빵집입니다.\",\n"
                    + "  \"openingHours\": \"매일 08:00 ~ 22:00\",\n"
                    + "  \"atmosphere\": \"복고풍 감성과 활기찬 분위기, 가족 단위 방문이 많음\",\n"
                    + "  \"menu\": [\n"
                    + "    \"튀김소보로\",\n"
                    + "    \"부추빵\",\n"
                    + "    \"치즈바게트\",\n"
                    + "    \"햄버거스테이크빵\",\n"
                    + "    \"단팥빵\"\n"
                    + "  ],\n"
                    + "  \"parking\": \"주차장은 별도로 없으며 인근 공영주차장 이용 가능\"\n"
                    + "}")
            .latitude(36.331348663430305)
            .longitude(127.42718875120441)
            .tagList(List.of(new TagSummaryDto(1L, "맛있어요"), new TagSummaryDto(2L, "친절해요")))
            .build();

    return ResponseEntity.ok(sample); // 200
  }

  @Operation(
      summary = "장소 좋아요",
      description = "사용자가 특정 장소에 좋아요를 누릅니다.",
      responses = {
        @ApiResponse(responseCode = "200", description = "좋아요 상태 변경 성공"),
        @ApiResponse(responseCode = "401", description = "로그인되지 않은 사용자", content = @Content),
        @ApiResponse(responseCode = "404", description = "해당 장소를 찾을 수 없음", content = @Content),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류", content = @Content)
      })
  @PostMapping("/like/{placeId}")
  public ResponseEntity<Void> likePlace(@PathVariable Long placeId) {
    return ResponseEntity.ok().build();
  }

  @Operation(
      summary = "장소 좋아요 취소",
      description = "사용자가 특정 장소에 눌러둔 좋아요를 취소합니다.",
      responses = {
        @ApiResponse(responseCode = "200", description = "좋아요 취소 성공"),
        @ApiResponse(responseCode = "401", description = "로그인되지 않은 사용자", content = @Content),
        @ApiResponse(responseCode = "404", description = "해당 장소를 찾을 수 없음", content = @Content),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류", content = @Content)
      })
  @DeleteMapping("/like/{placeId}")
  public ResponseEntity<Void> unlikePlace(@PathVariable Long placeId) {
    return ResponseEntity.ok().build();
  }
}
