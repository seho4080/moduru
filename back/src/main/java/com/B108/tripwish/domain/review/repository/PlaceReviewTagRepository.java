package com.B108.tripwish.domain.review.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.B108.tripwish.domain.review.entity.PlaceReviewTag;
import com.B108.tripwish.domain.review.entity.PlaceReviewTagId;

import io.lettuce.core.dynamic.annotation.Param;

public interface PlaceReviewTagRepository extends JpaRepository<PlaceReviewTag, PlaceReviewTagId> {

  @Query("SELECT pt.tag.content FROM PlaceReviewTag pt WHERE pt.review.place.id = :placeId")
  List<String> findTagNamesByPlaceId(@Param("placeId") Long placeId);
}
