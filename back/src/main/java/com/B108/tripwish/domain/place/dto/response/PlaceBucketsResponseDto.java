package com.B108.tripwish.domain.place.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

// NOTE: 카테고리별 + 내가 좋아요한 장소를 한 번에 내려주는 응답
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PlaceBucketsResponseDto {

    private List<PlaceResponseDto> restaurants; // category_id = 1
    private List<PlaceResponseDto> spots;       // category_id = 2
    private List<PlaceResponseDto> festivals;   // category_id = 3
    private List<PlaceResponseDto> myPlaces;    // 내가 좋아요한 모든 카테고리
}
