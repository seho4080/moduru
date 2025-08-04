package com.B108.tripwish.domain.review.repository;

import com.B108.tripwish.domain.review.entity.ReviewTag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewTagRepository extends JpaRepository<ReviewTag, Long> {

    List<String> findTagNamesByPlaceId(Long placeId);
}
