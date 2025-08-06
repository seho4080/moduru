package com.B108.tripwish.websocket.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class PlaceWantMessageRequestDto {
    private String action;     // 행위 타입: "add" 또는 "remove"
    private String type;       // 핀 타입: "place" 또는 "custom"
    private Long roomId;       // 여행방 ID
    private Long id;           // placeId 또는 customId
    private Long wantId;       // add: null
}
