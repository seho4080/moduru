package com.B108.tripwish.domain.review.repository;

import com.B108.tripwish.domain.review.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, Long> {


}
