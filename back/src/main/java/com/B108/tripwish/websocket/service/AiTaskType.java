package com.B108.tripwish.websocket.service;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public enum AiTaskType {
    SCHEDULE("schedule"),
    ROUTE("route");

    private final String code;
}
