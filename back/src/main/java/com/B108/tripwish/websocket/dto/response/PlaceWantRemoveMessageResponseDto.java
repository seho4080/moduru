package com.B108.tripwish.websocket.dto.response;

import com.B108.tripwish.global.common.enums.PlaceType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.ToString;

@Getter
@AllArgsConstructor
@ToString
public class PlaceWantRemoveMessageResponseDto{
    private Long roomId;
    private Long wantId;
    private String sendId;
}
