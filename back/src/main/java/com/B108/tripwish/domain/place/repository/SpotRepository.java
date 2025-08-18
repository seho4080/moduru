package com.B108.tripwish.domain.place.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.B108.tripwish.domain.place.entity.Place;
import com.B108.tripwish.domain.place.entity.Spot;

public interface SpotRepository extends JpaRepository<Spot, Long> {
  Optional<Spot> findByPlaceId(Place place);

  @Query("""
  SELECT s FROM Spot s
  WHERE s.placeId.id = :placeId
""")
  Optional<Spot> findByPlaceId(@Param("placeId") Long placeId);
}
