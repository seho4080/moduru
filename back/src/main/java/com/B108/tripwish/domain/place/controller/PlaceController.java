package com.B108.tripwish.domain.place.controller;

import java.util.List;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.place.service.PlaceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.B108.tripwish.domain.place.dto.response.PlaceDetailResponseDto;
import com.B108.tripwish.domain.place.dto.response.PlaceResponseDto;
import com.B108.tripwish.domain.place.dto.response.PlaceListResponseDto;
import com.B108.tripwish.domain.place.dto.response.ReviewTagResponseDto;

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
            summary = "지역 기반 기본 장소 목록 조회",
            description =
                    "장소 검색 탭의 지역 기반 기본 장소 목록을 카테고리별(all, restaurant, spot, festival)로 조회합니다.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "장소 목록 조회 성공"),
                    @ApiResponse(responseCode = "400", description = "잘못된 카테고리(type) 값 입력", content = @Content),
                    @ApiResponse(responseCode = "401", description = "인증 실패 (AccessToken 누락 / 유효하지 않음 / 만료됨)"),
                    @ApiResponse(
                            responseCode = "404",
                            description = "존재하지 않는 roomId / 존재하지 않는 category",
                            content = @Content),
                    @ApiResponse(responseCode = "500", description = "서버 내부 오류", content = @Content)
            })
    @GetMapping("")
    public ResponseEntity<PlaceListResponseDto> getAllPlaces(@AuthenticationPrincipal CustomUserDetails user,
                                                            @PathVariable Long roomId,
                                                            @RequestParam String category) {

        PlaceListResponseDto response = placeService.getPlaces(user, roomId, category);
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
    public ResponseEntity<PlaceDetailResponseDto> getDetailPlace(@AuthenticationPrincipal CustomUserDetails user,
                                                                 @PathVariable Long roomId,
                                                                 @RequestParam Long placeId) {
        PlaceDetailResponseDto response = placeService.getPlaceDetail(user, roomId, placeId);
        return ResponseEntity.ok(response); // 200
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
