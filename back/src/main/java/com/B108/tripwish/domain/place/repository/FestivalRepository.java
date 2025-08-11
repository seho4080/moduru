package com.B108.tripwish.domain.place.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.B108.tripwish.domain.place.entity.Festival;
import com.B108.tripwish.domain.place.entity.Place;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FestivalRepository extends JpaRepository<Festival, Long> {
  Optional<Festival> findByPlace(Place place);

  @Query("""
  SELECT f FROM Festival f
  WHERE f.place.id = :placeId
""")
  Optional<Festival> findByPlaceId(@Param("placeId") Long placeId);

}
