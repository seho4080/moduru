package com.B108.tripwish.websocket.service;

import java.util.List;

import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.place.entity.Place;
import com.B108.tripwish.domain.place.entity.PlaceImage;
import com.B108.tripwish.domain.place.service.PlaceReaderService;
import com.B108.tripwish.domain.room.entity.CustomPlace;
import com.B108.tripwish.domain.room.entity.WantPlace;
import com.B108.tripwish.domain.room.service.RoomReaderService;
import com.B108.tripwish.domain.room.service.WantPlaceReaderService;
import com.B108.tripwish.domain.room.service.WantPlaceService;
import com.B108.tripwish.domain.user.entity.User;
import com.B108.tripwish.domain.user.service.MyPlaceReaderService;
import com.B108.tripwish.global.common.enums.PlaceType;
import com.B108.tripwish.global.exception.CustomException;
import com.B108.tripwish.global.exception.ErrorCode;
import com.B108.tripwish.websocket.dto.request.PlaceWantAddRequestDto;
import com.B108.tripwish.websocket.dto.request.PlaceWantRemoveRequestDto;
import com.B108.tripwish.websocket.dto.response.PlaceWantAddMessageResponseDto;
import com.B108.tripwish.websocket.dto.response.PlaceWantRemoveMessageResponseDto;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PlaceWantSocketService {

  private final RedisPublisher redisPublisher;
  private final SimpMessageSendingOperations messagingTemplate;
  private final RoomReaderService roomReaderService;
  private final WantPlaceReaderService wantPlaceReaderService;
  private final WantPlaceService wantPlaceService;
  private final MyPlaceReaderService myPlaceReaderService;
  private final PlaceReaderService placeReaderService;

  public void handleAdd(CustomUserDetails sender, Long roomId, PlaceWantAddRequestDto request) {
    Long refId = request.getId();
    PlaceType type;
    try {
      type = PlaceType.valueOf(request.getType().toUpperCase());
    } catch (IllegalArgumentException e) {
      throw new CustomException(ErrorCode.UNSUPPORTED_PLACE_TYPE);
    }

    boolean exists = wantPlaceReaderService.isWanted(roomId, refId, type);
    if (exists) {
      throw new CustomException(ErrorCode.DUPLICATE_WANT_PLACE);
    }

    WantPlace saved = wantPlaceService.saveWantPlace(roomId, type, refId);
    Long wantId = saved.getId();

    // 장소 기본 정보 세팅
    Double lat;
    Double lng;
    String imgUrl;
    String placeName;
    String address;
    String category;

    if (type == PlaceType.CUSTOM) {
      CustomPlace customPlace = wantPlaceReaderService.getCustomPlaceById(refId);
      lat = customPlace.getLat();
      lng = customPlace.getLng();
      imgUrl = null;
      category = null;
      placeName = customPlace.getName();
      address = customPlace.getAddress();
    } else if (type == PlaceType.PLACE) {
      Place place = placeReaderService.findPlaceById(refId);
      place.getImages().size();
      lat = place.getLat();
      lng = place.getLng();
      category = place.getCategory().getCategoryName();
      List<PlaceImage> images = place.getImages();
      imgUrl = (images != null && !images.isEmpty()) ? images.get(0).getImgUrl() : null;
      placeName = place.getPlaceName();
      address = place.getRoadAddressName();
    } else {
      throw new CustomException(ErrorCode.UNSUPPORTED_PLACE_TYPE);
    }
    PlaceWantAddMessageResponseDto response =
        PlaceWantAddMessageResponseDto.builder()
            .type(request.getType())
            .id(request.getId())
            .roomId(request.getRoomId())
            .wantId(wantId)
            .sendId(sender.getUuid())
            .category(category)
            .placeName(placeName)
            .address(address)
            .lat(lat)
            .lng(lng)
            .imgUrl(imgUrl)
            .voteCnt(0L)
            .isVoted(false)
            .build();

    messagingTemplate.convertAndSend("/topic/room/" + roomId + "/place-want/add", response);
  }

  public void handleRemove(
      CustomUserDetails sender, Long roomId, PlaceWantRemoveRequestDto request) {

    // 희망장소 삭제
    wantPlaceService.removeWantPlace(roomId, request.getWantId());

    // 메시지 생성
    PlaceWantRemoveMessageResponseDto response =
        new PlaceWantRemoveMessageResponseDto(
            request.getWantId(), request.getRoomId(), sender.getUser().getUuid().toString());

    // 방에 속한 모든 유저에게 전송
    List<User> usersInRoom = roomReaderService.findUsersByRoomId(roomId);
    for (User u : usersInRoom) {
      messagingTemplate.convertAndSendToUser(sender.getUuid(), "/queue/place-want", response);
    }
    messagingTemplate.convertAndSend("/topic/room/" + roomId + "/place-want/remove", response);
  }
}
