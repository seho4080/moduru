package com.B108.tripwish.websocket.service;

public enum RedisChannelType {
  PLACE_WANT_ADD("place-want:add"),
  PLACE_WANT_REMOVE("place-want:remove"),
  SCHEDULE_UPDATE("schedule"),
  PLACE_VOTE("place:vote");

  private final String channel;

  RedisChannelType(String channel) {
    this.channel = channel;
  }

  public String getChannel() {
    return channel;
  }
}
