package com.B108.tripwish.websocket.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class PlaceWantRemoveRequestDto {
    private Long roomId;
    private Long wantId;
}
