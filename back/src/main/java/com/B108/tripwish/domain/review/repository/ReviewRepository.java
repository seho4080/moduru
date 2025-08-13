package com.B108.tripwish.domain.review.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.B108.tripwish.domain.review.entity.Review;

public interface ReviewRepository extends JpaRepository<Review, Long> {

  @Query("SELECT r FROM Review r WHERE r.userId = :userId")
  List<Review> findByUserId(@Param("userId") Long userId);

  @Query("SELECT r FROM Review r WHERE r.place = :placeId")
  List<Review> findByPlaceId(@Param("placeId") Long placeId);
}
