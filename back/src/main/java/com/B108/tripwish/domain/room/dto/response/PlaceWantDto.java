package com.B108.tripwish.domain.room.dto.response;

import com.B108.tripwish.global.common.enums.PlaceType;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlaceWantDto {
  private Long wantId;
  private PlaceType type;
  private Long refId;
  private String placeImg;
  private String category;
  private String placeName;
  private String address;
  private Double lat;
  private Double lng;
  private Boolean isLiked;
  private Boolean isVoted;
  private Long voteCnt;
}
