package com.B108.tripwish.websocket.dto.response;

public interface PlaceWantMessage {
    String getAction(); // "add", "remove"
    Long getId();
}
