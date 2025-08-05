package com.B108.tripwish.domain.room.service;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.place.entity.Place;
import com.B108.tripwish.domain.room.entity.VotePlace;
import com.B108.tripwish.domain.room.entity.VotePlaceId;
import com.B108.tripwish.domain.room.entity.WantPlace;
import com.B108.tripwish.domain.room.repository.VotePlaceRepository;
import com.B108.tripwish.domain.room.repository.WantPlaceRepository;
import com.B108.tripwish.domain.user.entity.MyPlace;
import com.B108.tripwish.domain.user.entity.MyPlaceId;
import com.B108.tripwish.global.exception.CustomException;
import com.B108.tripwish.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class WantPlaceServiceImpl implements WantPlaceService{

    private final WantPlaceRepository wantPlaceRepository;
    private final VotePlaceRepository votePlaceRepository;


    @Override
    public void toggleVotePlace(CustomUserDetails user, Long wantId) {
        WantPlace wantPlace = wantPlaceRepository.findByPlace_Id(wantId)
                .orElseThrow(() -> new CustomException(ErrorCode.WANT_PLACE_NOT_FOUND));

        VotePlaceId id = new VotePlaceId(wantPlace.getId(), user.getUser().getId());

        VotePlace votePlace = votePlaceRepository.findById(id).orElse(null);

        if (votePlace != null) {
            // 이미 존재하면 -> vote 필드 toggle
            votePlace.setVote(!votePlace.isVote());
            log.info("🔁 [toggleVotePlace] 투표 상태 토글 - userId: {}, wantId: {}, vote: {}",
                    user.getUser().getId(), wantPlace.getId(), votePlace.isVote());
        } else {
            // 존재하지 않으면 새로 생성
            votePlace = VotePlace.builder()
                    .id(id)
                    .user(user.getUser())
                    .wantPlace(wantPlace)
                    .vote(true)  // 처음은 항상 true
                    .build();
            log.info("✅ [toggleVotePlace] 새 투표 생성 - userId: {}, wantId: {}",
                    user.getUser().getId(), wantPlace.getId());
        }

        votePlaceRepository.save(votePlace);
    }
}
