package com.B108.tripwish.domain.room.repository;

import com.B108.tripwish.domain.room.entity.VotePlace;
import com.B108.tripwish.domain.room.entity.VotePlaceId;
import com.B108.tripwish.domain.room.entity.WantPlace;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VotePlaceRepository extends JpaRepository<VotePlace, VotePlaceId> {

    boolean existsByIdAndVoteIsTrue(VotePlaceId id);

    Long countByWantPlaceAndVoteIsTrue(WantPlace wantPlace);

}
