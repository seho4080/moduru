package com.B108.tripwish.domain.room.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.B108.tripwish.domain.room.entity.WantPlace;

public interface WantPlaceRepository extends JpaRepository<WantPlace, Long> {
  boolean existsByTravelRoom_IdAndPlace_Id(Long roomId, Long placeId);
}
