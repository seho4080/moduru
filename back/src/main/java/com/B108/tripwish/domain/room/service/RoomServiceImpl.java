package com.B108.tripwish.domain.room.service;

import com.B108.tripwish.domain.room.dto.response.TravelRoomCreateResponseDto;
import com.B108.tripwish.domain.room.dto.response.TravelRoomResponseDto;
import com.B108.tripwish.domain.room.entity.TravelRoom;
import com.B108.tripwish.domain.room.repository.TravelRoomRepository;
import com.B108.tripwish.global.exception.CustomException;
import com.B108.tripwish.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoomServiceImpl implements RoomService{

    private final TravelRoomRepository travelRoomRepository;

    @Transactional
    @Override
    public TravelRoomCreateResponseDto addRoom() {
        TravelRoom room = TravelRoom.builder()
                .title("이름 없는 사용자"+"_"+ LocalDateTime.now())
                .build();
        travelRoomRepository.save(room);
        TravelRoomCreateResponseDto response = new TravelRoomCreateResponseDto(room.getRoomId());
        return response;
    }

    @Override
    public TravelRoomResponseDto enterRoom(Long roomId) {
        TravelRoom room =  travelRoomRepository.findByRoomId(roomId).orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));
        TravelRoomResponseDto response = TravelRoomResponseDto.from(room);
        return response;
    }
}
