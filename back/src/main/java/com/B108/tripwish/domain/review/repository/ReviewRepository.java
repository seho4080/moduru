package com.B108.tripwish.domain.review.repository;

import com.B108.tripwish.domain.review.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

  @Query("SELECT r FROM Review r WHERE r.userId = :userId")
  List<Review> findByUserId(@Param("userId") Long userId);

  @Query("SELECT r FROM Review r WHERE r.placeId = :placeId")
  List<Review> findByPlaceId(@Param("placeId") Long placeId);
}
