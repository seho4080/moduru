package com.B108.tripwish.domain.review.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.B108.tripwish.domain.review.entity.ReviewTag;

public interface ReviewTagRepository extends JpaRepository<ReviewTag, Long> {

  // 카테고리별 태그 조회
  @Query("SELECT t FROM ReviewTag t WHERE t.categoryId = :categoryId OR t.categoryId = 4")
  List<ReviewTag> findByCategoryIdOrCommon(@Param("categoryId") Long categoryId);
}
