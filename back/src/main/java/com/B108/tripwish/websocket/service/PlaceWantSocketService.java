package com.B108.tripwish.websocket.service;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.place.entity.Place;
import com.B108.tripwish.domain.place.entity.PlaceImage;
import com.B108.tripwish.domain.place.respoistory.PlaceRepository;
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
import com.B108.tripwish.websocket.dto.request.PlaceWantMessageRequestDto;
import com.B108.tripwish.websocket.dto.response.PlaceWantAddMessageResponseDto;
import com.B108.tripwish.websocket.dto.response.PlaceWantRemoveMessageResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;

import java.util.List;

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

    public void handleAdd(CustomUserDetails sender, Long roomId, PlaceWantMessageRequestDto request) {
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

        if (type == PlaceType.CUSTOM) {
            CustomPlace customPlace = wantPlaceReaderService.getCustomPlaceById(refId);
            lat = customPlace.getLat();
            lng = customPlace.getLng();
            imgUrl = null;
        } else if (type == PlaceType.PLACE) {
            Place place = placeReaderService.findPlaceById(refId);
            lat = place.getLat();
            lng = place.getLng();
            List<PlaceImage> images = place.getImages();
            imgUrl = (images != null && !images.isEmpty()) ? images.get(0).getImgUrl() : null;
        } else {
            throw new CustomException(ErrorCode.UNSUPPORTED_PLACE_TYPE);
        }

        // 모든 사용자에게 개별 메시지 전송
        List<User> usersInRoom = roomReaderService.findUsersByRoomId(roomId);

        for (User u : usersInRoom) {
            boolean isLiked = myPlaceReaderService.isLiked(u.getId(), refId);
            boolean isVoted = wantPlaceReaderService.isVotedByUser(u.getId(), wantId);
            Long voteCnt = wantPlaceReaderService.getVoteCount(wantId, saved);

            PlaceWantAddMessageResponseDto response = PlaceWantAddMessageResponseDto.builder()
                    .roomId(roomId)
                    .type(type.name().toLowerCase())
                    .id(refId)
                    .wantId(saved.getId())
                    .lat(lat)
                    .lng(lng)
                    .imgUrl(imgUrl)
                    .isLiked(isLiked)
                    .isVoted(isVoted)
                    .voteCnt(voteCnt)
                    .build();

            messagingTemplate.convertAndSendToUser(u.getUuid().toString(), "/queue/place-want", response);
        }
    }

    public void handleRemove(CustomUserDetails sender, Long roomId, PlaceWantMessageRequestDto request){
        Long refId = request.getId();
        PlaceType type = PlaceType.valueOf(request.getType().toUpperCase());

        // 희망장소 삭제
        wantPlaceService.removeWantPlace(roomId, refId, type);

        // 메시지 생성
        PlaceWantRemoveMessageResponseDto response = new PlaceWantRemoveMessageResponseDto(
                request.getAction(),
                roomId,
                type.toString().toLowerCase(),
                refId
        );

        // 방에 속한 모든 유저에게 전송
        List<User> usersInRoom = roomReaderService.findUsersByRoomId(roomId);
        for (User u : usersInRoom) {
            messagingTemplate.convertAndSendToUser(u.getUuid().toString(), "/queue/place-want", response);
        }
    }
}

