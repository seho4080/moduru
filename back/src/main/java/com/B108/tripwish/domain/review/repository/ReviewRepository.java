package com.B108.tripwish.domain.review.repository;

import com.B108.tripwish.domain.review.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<String> findTagNamesByPlaceId(Long placeId);

}
