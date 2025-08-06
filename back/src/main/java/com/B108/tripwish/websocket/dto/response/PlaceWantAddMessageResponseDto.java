package com.B108.tripwish.websocket.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@Getter
@Builder
@AllArgsConstructor
@ToString
public class PlaceWantAddMessageResponseDto implements PlaceWantMessage{
    private Long roomId;
    private String action = "add";  // 항상 "add"
    private String type;
    private Long id;
    private Long wantId;
    private Double lat;
    private Double lng;
    private String placeName;
    private String imgUrl;
    private boolean isLiked;
    private Long voteCnt;
    private boolean isVoted;

}
