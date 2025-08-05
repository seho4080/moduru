package com.B108.tripwish.domain.place.dto.response;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlaceDetailResponseDto {
  private List<String> placeImages;
  private Long placeId;
  private String category;
  private String placeName;
  private String address;
  private Double latitude;
  private Double longitude;
  private Boolean isLiked;
  private Boolean isWanted;
  private List<String> reviewTags;
  private List<String> metaDataTags;


  @Schema(
          description = "카테고리에 따른 상세 정보: 음식점/관광지/축제 중 하나",
          oneOf = {
                  RestaurantDetailResponseDto.class,
                  SpotDetailResponseDto.class,
                  FestivalDetailResponseDto.class
          }
  )
  private CategoryDetailResponseDto categoryDetail;


}
