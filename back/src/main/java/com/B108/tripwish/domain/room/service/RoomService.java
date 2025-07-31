package com.B108.tripwish.domain.room.service;

import com.B108.tripwish.domain.room.dto.response.TravelRoomCreateResponseDto;
import com.B108.tripwish.domain.room.dto.response.TravelRoomResponseDto;

public interface RoomService {
    TravelRoomCreateResponseDto addRoom();

    TravelRoomResponseDto enterRoom(Long roomId);
}
