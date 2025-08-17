package com.B108.tripwish.domain.place.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.B108.tripwish.domain.place.entity.Festival;
import com.B108.tripwish.domain.place.entity.Place;

public interface FestivalRepository extends JpaRepository<Festival, Long> {
  Optional<Festival> findByPlaceId(Place place);

  @Query("""
  SELECT f FROM Festival f
  WHERE f.placeId.id = :placeId
""")
  Optional<Festival> findByPlaceId(@Param("placeId") Long placeId);
}
