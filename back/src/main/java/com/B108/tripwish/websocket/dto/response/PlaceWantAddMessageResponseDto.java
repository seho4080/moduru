package com.B108.tripwish.websocket.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@Getter
@Builder
@AllArgsConstructor
@ToString
public class PlaceWantAddMessageResponseDto{
    private String type;
    private Long id;
    private Long roomId;
    private Long wantId;
    private String sendId;
    private String category;
    private String placeName;
    private String address;
    private Double lat;
    private Double lng;
    private String imgUrl;
    private Long voteCnt;
    private boolean isVoted;


}
