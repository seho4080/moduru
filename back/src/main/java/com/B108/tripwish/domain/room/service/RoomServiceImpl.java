package com.B108.tripwish.domain.room.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

@Service
@RequiredArgsConstructor
@Slf4j
public class RoomServiceImpl implements RoomService {

  private final TravelRoomRepository travelRoomRepository;
  private final TravelMemberRepository travelMemberRepository;
  private final TravelRoomMapper travelRoomMapper;

  @Transactional
  @Override
  public TravelRoomCreateResponseDto addRoom(CustomUserDetails user) {
    String title;

    if (user == null || user.getUser() == null) {
      throw new CustomException(ErrorCode.USER_NOT_FOUND); // 사용자 정보 없음
    } else {
      title = user.getUser().getNickname() + "_" + LocalDateTime.now();
    }

    TravelRoom room = TravelRoom.builder().title(title).build();
    travelRoomRepository.save(room);

    TravelMember member =
        TravelMember.builder()
            .travelRoom(room)
            .user(user.getUser())
            .role(TravelMemberRole.OWNER)
            .id(new TravelMemberId(room.getId(), user.getUser().getId()))
            .build();
    travelMemberRepository.save(member);

    TravelRoomCreateResponseDto response = new TravelRoomCreateResponseDto(room.getId());
    return response;
  }

  @Override
  public TravelRoomResponseDto enterRoom(CustomUserDetails user, Long roomId) {
    TravelRoom room =
        travelRoomRepository
            .findById(roomId)
            .orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));
    TravelRoomResponseDto response = TravelRoomResponseDto.from(room);
    return response;
  }

  @Transactional
  @Override
  public TravelRoomResponseDto updateRoom(Long roomId, UpdateTravelRoomRequestDto request) {
    log.info("🔍 요청 DTO: title={}, region={}, startDate={}, endDate={}",
            request.getTitle(), request.getRegion(), request.getStartDate(), request.getEndDate());

    TravelRoom room =
        travelRoomRepository
            .findById(roomId)
            .orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));
    travelRoomMapper.updateFromDto(request, room);
    return travelRoomMapper.toDto(room);
  }

  @Transactional
  @Override
  public void deleteRoom(CustomUserDetails user, Long roomId) {
    Long userId = user.getUser().getId();
    TravelMember member =
        travelMemberRepository
            .findByUser_IdAndTravelRoom_Id(userId, roomId)
            .orElseThrow(() -> new CustomException(ErrorCode.ROOM_MEMBER_NOT_FOUND));
    if (member.getRole() != TravelMemberRole.OWNER) {
      throw new CustomException(ErrorCode.ROOM_DELETE_FORBIDDEN); // 권한 없음
    }

    travelRoomRepository.deleteById(roomId);
  }

  @Override
  public String getRegionByRoomId(Long roomId) {
    TravelRoom room = travelRoomRepository.findById(roomId)
            .orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));
    return room.getRegion();
  }

  @Override
  public TravelRoom findById(Long roomId) {
    TravelRoom room = travelRoomRepository.findById(roomId)
            .orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));
    return room;
  }
}
