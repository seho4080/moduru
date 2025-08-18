package com.B108.tripwish.websocket.service;

public enum RedisChannelType {
  PLACE_WANT_ADD("place-want:add"),
  PLACE_WANT_REMOVE("place-want:remove"),
  SCHEDULE_UPDATE("schedule"),
  PLACE_VOTE("place:vote"),
  TRAVEL_TIME_STATUS("travel:status"), // STARTED / ALREADY_RUNNING / DONE / FAILED
  TRAVEL_TIME_RESULT("travel:result"), // RouteResultResponseDto 본문
  AI_SCHEDULE_STATUS("ai-schedule:status"),
  AI_SCHEDULE_RESULT("ai-schedule:result"),
  AI_ROUTE_RESULT("ai-route:result"),
  AI_ROUTE_STATUS("ai-route:status");

  private final String channel;

  RedisChannelType(String channel) {
    this.channel = channel;
  }

  public String getChannel() {
    return channel;
  }
}
