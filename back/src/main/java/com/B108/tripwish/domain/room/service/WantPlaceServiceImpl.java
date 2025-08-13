package com.B108.tripwish.domain.room.service;

import com.B108.tripwish.websocket.service.VotePlaceSocketService;
import org.springframework.stereotype.Service;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.room.entity.VotePlace;
import com.B108.tripwish.domain.room.entity.VotePlaceId;
import com.B108.tripwish.domain.room.entity.WantPlace;
import com.B108.tripwish.domain.room.repository.TravelRoomRepository;
import com.B108.tripwish.domain.room.repository.VotePlaceRepository;
import com.B108.tripwish.domain.room.repository.WantPlaceRepository;
import com.B108.tripwish.global.common.enums.PlaceType;
import com.B108.tripwish.global.exception.CustomException;
import com.B108.tripwish.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class WantPlaceServiceImpl implements WantPlaceService {

  private final WantPlaceRepository wantPlaceRepository;
  private final VotePlaceRepository votePlaceRepository;
  private final TravelRoomRepository travelRoomRepository;

  private final VotePlaceSocketService votePlaceSocketService;

  @Override
  public void toggleVotePlace(CustomUserDetails user, Long roomId, Long wantId) {
    WantPlace wantPlace =
        wantPlaceRepository
            .findById(wantId)
            .orElseThrow(() -> new CustomException(ErrorCode.WANT_PLACE_NOT_FOUND));

    VotePlaceId id = new VotePlaceId(wantPlace.getId(), user.getUser().getId());

    VotePlace votePlace = votePlaceRepository.findById(id).orElse(null);

    if (votePlace != null) {
      // 이미 존재하면 -> vote 필드 toggle
      votePlace.setVote(!votePlace.isVote());
      log.info(
          "🔁 [toggleVotePlace] 투표 상태 토글 - userId: {}, wantId: {}, vote: {}",
          user.getUser().getId(),
          wantPlace.getId(),
          votePlace.isVote());
    } else {
      // 존재하지 않으면 새로 생성
      votePlace =
          VotePlace.builder()
              .id(id)
              .user(user.getUser())
              .wantPlace(wantPlace)
              .vote(true) // 처음은 항상 true
              .build();
      log.info(
          "✅ [toggleVotePlace] 새 투표 생성 - userId: {}, wantId: {}",
          user.getUser().getId(),
          wantPlace.getId());
    }

    votePlaceRepository.save(votePlace);

    int voteCnt = votePlaceRepository.countByWantPlaceAndVoteIsTrue(wantPlace).intValue();

    String receiverId = user.getUuid().toString();
    votePlaceSocketService.sendVoteResult(roomId, wantId, voteCnt, receiverId);
  }

  @Override
  public WantPlace saveWantPlace(Long roomId, PlaceType type, Long refId) {

    var travelRoom =
        travelRoomRepository
            .findById(roomId)
            .orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));

    WantPlace wantPlace =
        WantPlace.builder().travelRoom(travelRoom).type(type).refId(refId).build();

    return wantPlaceRepository.save(wantPlace);
  }

  @Override
  public void removeWantPlace(Long roomId, Long wantId) {
    WantPlace wantPlace =
        wantPlaceRepository
            .findById(wantId)
            .orElseThrow(() -> new CustomException(ErrorCode.WANT_PLACE_NOT_FOUND));
    wantPlaceRepository.delete(wantPlace);
  }
}
