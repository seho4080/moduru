package com.B108.tripwish.domain.review.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.B108.tripwish.domain.review.entity.Review;

public interface ReviewRepository extends JpaRepository<Review, Long> {

  Optional<Review> findByIdAndUser_Id(Long reviewId, Long userId);

  //  @Query("SELECT r FROM Review r WHERE r.userId = :userId")
  //  List<Review> findByUser_Id(@Param("userId") Long userId);
  List<Review> findByUser_Id(Long userId);

  //  @Query("SELECT r FROM Review r WHERE r.place = :placeId")
  //  List<Review> findByPlace_Id(@Param("placeId") Long placeId);
  List<Review> findByPlace_Id(Long placeId);
}
