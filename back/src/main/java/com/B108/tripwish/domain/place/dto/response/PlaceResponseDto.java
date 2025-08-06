package com.B108.tripwish.domain.place.dto.response;

import com.B108.tripwish.domain.place.entity.Place;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlaceResponseDto {
  private Long placeId;
  private String placeName;
  private String placeImg;
  private String category;
  private String address;
  private Double latitude;
  private Double longitude;
  private Boolean isLiked;
  private Boolean isWanted;

  public static PlaceResponseDto fromEntity(Place place, boolean isLiked, boolean isWanted) {
    String imageUrl = null;
    if (place.getImages() != null && !place.getImages().isEmpty()) {
      imageUrl = place.getImages().get(0).getImgUrl();
    }
    return new PlaceResponseDto(
        place.getId(),
        place.getPlaceName(),
        imageUrl,
        place.getCategory().getCategoryName(),
        place.getRoadAddressName(),
        place.getLat(),
        place.getLng(),
        isLiked,
        isWanted);
  }
}
