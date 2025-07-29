package com.B108.tripwish.domain.place.dto.response;

import com.fasterxml.jackson.annotation.JsonRawValue;
import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlaceDetailResponseDto {
    private String placeImg;
    private String placeName;
    private String address;
    private Double latitude;
    private Double longitude;
    private Boolean isLiked;
    private Boolean isWanted;

    @JsonRawValue
    private String detailGPT;

    private List<TagSummaryDto> tagList;

}
