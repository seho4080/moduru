package com.B108.tripwish.domain.room.service;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.room.dto.request.UpdateTravelRoomRequestDto;
import com.B108.tripwish.domain.room.dto.response.TravelRoomCreateResponseDto;
import com.B108.tripwish.domain.room.dto.response.TravelRoomResponseDto;
import com.B108.tripwish.domain.room.entity.TravelMember;
import com.B108.tripwish.domain.room.entity.TravelMemberId;
import com.B108.tripwish.domain.room.entity.TravelMemberRole;
import com.B108.tripwish.domain.room.entity.TravelRoom;
import com.B108.tripwish.domain.room.mapper.TravelRoomMapper;
import com.B108.tripwish.domain.room.repository.TravelMemberRepository;
import com.B108.tripwish.domain.room.repository.TravelRoomRepository;
import com.B108.tripwish.global.exception.CustomException;
import com.B108.tripwish.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoomServiceImpl implements RoomService{

    private final TravelRoomRepository travelRoomRepository;
    private final TravelMemberRepository travelMemberRepository;
    private final TravelRoomMapper travelRoomMapper;

    @Transactional
    @Override
    public TravelRoomCreateResponseDto addRoom(CustomUserDetails user) {
        String title;

        if (user == null || user.getUser() == null) {
            throw new CustomException(ErrorCode.USER_NOT_FOUND);  // 사용자 정보 없음
        } else {
            title = user.getUser().getNickname() + "_" + LocalDateTime.now();
        }

        TravelRoom room = TravelRoom.builder()
                .title(title)
                .build();
        travelRoomRepository.save(room);

        TravelMember member = TravelMember.builder()
                .travelRoom(room)
                .user(user.getUser())
                .role(TravelMemberRole.OWNER)
                .id(new TravelMemberId(room.getRoomId(), user.getUser().getId()))
                .build();
        travelMemberRepository.save(member);

        TravelRoomCreateResponseDto response = new TravelRoomCreateResponseDto(room.getRoomId());
        return response;
    }

    @Override
    public TravelRoomResponseDto enterRoom(CustomUserDetails user, Long roomId) {
        TravelRoom room =  travelRoomRepository.findByRoomId(roomId).orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));
        TravelRoomResponseDto response = TravelRoomResponseDto.from(room);
        return response;
    }

    @Transactional
    @Override
    public TravelRoomResponseDto updateRoom(Long roomId, UpdateTravelRoomRequestDto request) {
        TravelRoom room =  travelRoomRepository.findByRoomId(roomId).orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));
        travelRoomMapper.updateFromDto(request, room);
        return travelRoomMapper.toDto(room);
    }
}
