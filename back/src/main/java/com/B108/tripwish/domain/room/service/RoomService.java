package com.B108.tripwish.domain.room.service;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.room.dto.request.CustomPlaceCreateRequestDto;
import com.B108.tripwish.domain.room.dto.request.UpdateTravelRoomRequestDto;
import com.B108.tripwish.domain.room.dto.response.TravelMemberListResponseDto;
import com.B108.tripwish.domain.room.dto.response.TravelRoomCreateResponseDto;
import com.B108.tripwish.domain.room.dto.response.TravelRoomResponseDto;
import com.B108.tripwish.global.common.entity.Region;

public interface RoomService {
  TravelRoomCreateResponseDto addRoom(CustomUserDetails user);

  TravelRoomResponseDto enterRoom(CustomUserDetails user, Long roomId);

  TravelRoomResponseDto updateRoom(Long roomId, UpdateTravelRoomRequestDto request);

  void deleteRoom(CustomUserDetails user, Long roomId);

  Region getRegionByRoomId(Long roomId);

  Long createCustomPlace(CustomPlaceCreateRequestDto dto);

  // 여행방 탈퇴
  void leaveRoom(CustomUserDetails user, Long roomId);

  // 동행자 목록 조회
  TravelMemberListResponseDto getTravelMembers(Long roomId);

  // 동행자 강퇴
  void kickMember(CustomUserDetails user, Long roomId, Long targetUserId);

}
