package com.B108.tripwish.domain.room.service;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.auth.service.CustomUserDetailsService;
import com.B108.tripwish.domain.room.dto.request.UpdateTravelRoomRequestDto;
import com.B108.tripwish.domain.room.dto.response.TravelRoomCreateResponseDto;
import com.B108.tripwish.domain.room.dto.response.TravelRoomResponseDto;
import org.hibernate.sql.Update;
import org.springframework.security.core.userdetails.UserDetails;

public interface RoomService {
    TravelRoomCreateResponseDto addRoom(CustomUserDetails user);

    TravelRoomResponseDto enterRoom(CustomUserDetails user, Long roomId);

    TravelRoomResponseDto updateRoom(Long roomId, UpdateTravelRoomRequestDto request);


}
