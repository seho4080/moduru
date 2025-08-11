package com.B108.tripwish.websocket.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Builder
public class TravelTimeStatusMessage {
    public enum Status { STARTED, ALREADY_RUNNING, DONE, FAILED }
    private Long roomId; private Integer day;
    private Status status; private String message;
}
