package com.B108.tripwish.domain.room.dto.response;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlaceWantDto {
  private Long wantId;
  private Long placeId;
  private String placeName;
  private String placeImg;
  private String category;
  private String address;
  private Double latitude;
  private Double longitude;
  private Boolean isLiked;
  private Boolean isWanted;
  private Boolean isVoted;
}
