package com.B108.tripwish.domain.place.dto.response;

import com.fasterxml.jackson.annotation.JsonRawValue;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PlaceDetailResponseDto {
    private String placeImg;
    private String placeName;
    private String address;
    private Boolean isLiked;
    private Boolean isWanted;

    @JsonRawValue
    private String detailGPT;

    private List<TagSummaryDto> tagList;

}
