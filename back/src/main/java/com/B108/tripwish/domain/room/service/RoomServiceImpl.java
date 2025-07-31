package com.B108.tripwish.domain.room.service;

import com.B108.tripwish.domain.room.dto.response.TravelRoomCreateResponseDto;
import com.B108.tripwish.domain.room.entity.TravelRoom;
import com.B108.tripwish.domain.room.repository.TravelRoomRepository;
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
}
