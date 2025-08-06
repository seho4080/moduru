package com.B108.tripwish.websocket.dto.response;

import com.B108.tripwish.global.common.enums.PlaceType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.ToString;

@Getter
@AllArgsConstructor
@ToString
public class PlaceWantRemoveMessageResponseDto implements PlaceWantMessage{
    private String action = "remove";  // 항상 "remove"
    private Long roomId;
    private String type;
    private Long id;
}
