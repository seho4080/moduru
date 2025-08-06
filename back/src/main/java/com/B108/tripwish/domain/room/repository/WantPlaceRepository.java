package com.B108.tripwish.domain.room.repository;

import com.B108.tripwish.domain.room.entity.WantPlace;
import com.B108.tripwish.global.common.enums.PlaceType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WantPlaceRepository extends JpaRepository<WantPlace, Long> {
    boolean existsByTravelRoom_IdAndRefIdAndType(Long roomId, Long placeId, PlaceType type);

    Optional<WantPlace> findById(Long wantId);

    Optional<WantPlace> findByTravelRoom_IdAndRefIdAndType(Long roomId, Long refId, PlaceType type);


}
