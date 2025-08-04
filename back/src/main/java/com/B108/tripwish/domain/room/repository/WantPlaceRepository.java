package com.B108.tripwish.domain.room.repository;

import com.B108.tripwish.domain.room.entity.WantPlace;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WantPlaceRepository extends JpaRepository<WantPlace, Long> {
    boolean existsByTravelRoom_IdAndPlace_Id(Long roomId, Long placeId);
}
