package com.B108.tripwish.domain.review.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.B108.tripwish.domain.review.entity.PlaceReviewTag;
import com.B108.tripwish.domain.review.entity.PlaceReviewTagId;

public interface PlaceReviewTagRepository extends JpaRepository<PlaceReviewTag, PlaceReviewTagId> {
  // 리뷰 ID로 조인행 전부 조회
  List<PlaceReviewTag> findById_ReviewId(Long reviewId);

  // 리뷰 ID로 조인행 전부 삭제
  void deleteById_ReviewId(Long reviewId);

  @Query(
      value =
          "SELECT t.content "
              + "FROM place_review_tags pt "
              + "JOIN review_tags t ON pt.tag_id = t.id "
              + "JOIN reviews r ON pt.review_id = r.id "
              + "WHERE r.place_id = :placeId",
      nativeQuery = true)
  List<String> findTagNamesByPlaceId(@Param("placeId") Long placeId);
}
