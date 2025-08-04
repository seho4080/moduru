package com.B108.tripwish.domain.room.service;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.room.dto.request.UpdateTravelRoomRequestDto;
import com.B108.tripwish.domain.room.dto.response.TravelRoomCreateResponseDto;
import com.B108.tripwish.domain.room.dto.response.TravelRoomResponseDto;

public interface RoomService {
  TravelRoomCreateResponseDto addRoom(CustomUserDetails user);

  TravelRoomResponseDto enterRoom(CustomUserDetails user, Long roomId);

  TravelRoomResponseDto updateRoom(Long roomId, UpdateTravelRoomRequestDto request);

  void deleteRoom(CustomUserDetails user, Long roomId);

  String getRegionByRoomId(Long roomId);

}
