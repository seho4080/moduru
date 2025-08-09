package com.B108.tripwish.domain.room.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.kakaomap.service.KakaomapService;
import com.B108.tripwish.domain.room.dto.request.CustomPlaceCreateRequestDto;
import com.B108.tripwish.domain.room.dto.request.UpdateTravelRoomRequestDto;
import com.B108.tripwish.domain.room.dto.response.TravelRoomCreateResponseDto;
import com.B108.tripwish.domain.room.dto.response.TravelRoomResponseDto;
import com.B108.tripwish.domain.room.entity.*;
import com.B108.tripwish.domain.room.mapper.TravelRoomMapper;
import com.B108.tripwish.domain.room.repository.CustomPlaceRepository;
import com.B108.tripwish.domain.room.repository.TravelMemberRepository;
import com.B108.tripwish.domain.room.repository.TravelRoomRepository;
import com.B108.tripwish.global.common.entity.Region;
import com.B108.tripwish.global.common.repository.RegionRepository;
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
  private final RegionRepository regionRepository;
  private final TravelRoomMapper travelRoomMapper;
  private final CustomPlaceRepository customPlaceRepository;
  private final KakaomapService kakaomapService;

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
    TravelRoom room =
        travelRoomRepository
            .findById(roomId)
            .orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));
    travelRoomMapper.updateFromDto(request, room);

    Region region =
        regionRepository
            .findByName(request.getRegion())
            .orElseThrow(() -> new CustomException(ErrorCode.REGION_NOT_FOUND));

    room.setRegion(region);
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
  public Region getRegionByRoomId(Long roomId) {
    TravelRoom room =
        travelRoomRepository
            .findById(roomId)
            .orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));
    return room.getRegion();
  }

  @Transactional
  public Long createCustomPlace(CustomPlaceCreateRequestDto dto) {
    TravelRoom room =
        travelRoomRepository
            .findById(dto.getRoomId())
            .orElseThrow(() -> new IllegalArgumentException("해당 room이 존재하지 않습니다."));

    // 카카오 API로 주소 받아오기
    String address = kakaomapService.getAddressFromCoords(dto.getLat(), dto.getLng()).getAddress();

    CustomPlace customPlace =
        CustomPlace.builder()
            .room(room)
            .name(dto.getName())
            .lat(dto.getLat())
            .lng(dto.getLng())
            .address(address)
            .build();

    return customPlaceRepository.save(customPlace).getId();
  }
}
