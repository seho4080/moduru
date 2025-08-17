package com.B108.tripwish.domain.review.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.B108.tripwish.domain.review.entity.PlaceTagCount;
import com.B108.tripwish.domain.review.entity.PlaceTagCountId;

public interface PlaceTagCountRepository extends JpaRepository<PlaceTagCount, PlaceTagCountId> {
  @Query("SELECT p FROM PlaceTagCount p WHERE p.id.placeId = :placeId AND p.id.tagId = :tagId")
  Optional<PlaceTagCount> findByPlaceIdAndTagId(
      @Param("placeId") Long placeId, @Param("tagId") Long tagId);
}
