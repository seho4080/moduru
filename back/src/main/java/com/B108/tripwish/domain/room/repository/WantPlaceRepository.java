package com.B108.tripwish.domain.room.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.data.jpa.repository.JpaRepository;

import com.B108.tripwish.domain.room.entity.WantPlace;
import com.B108.tripwish.global.common.enums.PlaceType;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WantPlaceRepository extends JpaRepository<WantPlace, Long> {
  boolean existsByTravelRoom_IdAndRefIdAndType(Long roomId, Long placeId, PlaceType type);

  Optional<WantPlace> findById(Long wantId);

  Optional<WantPlace> findByTravelRoom_IdAndRefIdAndType(Long roomId, Long refId, PlaceType type);

  List<WantPlace> findAllByTravelRoom_Id(Long roomId);

  @Query("""
  SELECT wp.refId
  FROM WantPlace wp
  WHERE wp.travelRoom.id = :roomId
    AND wp.refId IN :placeIds
    AND wp.type = :type
""")
  Set<Long> findWantedPlaceIds(@Param("roomId") Long roomId,
                               @Param("placeIds") Collection<Long> placeIds,
                               @Param("type") PlaceType type);

}
