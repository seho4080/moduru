package com.B108.tripwish.domain.review.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.B108.tripwish.domain.review.entity.Review;

public interface ReviewRepository extends JpaRepository<Review, Long> {}
