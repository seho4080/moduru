package com.B108.tripwish.websocket.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Getter
//@NoArgsConstructor
@AllArgsConstructor
@ToString
public class PlaceWantMessageRequestDto {
    private String type;     // 메시지 타입: "pin:add" 또는 "pin:remove"
    private String roomId;   // 여행방 ID
    private String id;       // 핀 ID
    private Double lat;      // 위도 (type == "pin:add"일 때만 사용)
    private Double lng;      // 경도 (type == "pin:add"일 때만 사용)
}
