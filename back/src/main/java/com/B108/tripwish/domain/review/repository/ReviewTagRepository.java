package com.B108.tripwish.domain.review.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.B108.tripwish.domain.review.dto.ReviewTagDto;
import com.B108.tripwish.domain.review.entity.ReviewTag;

public interface ReviewTagRepository extends JpaRepository<ReviewTag, Long> {

  // 카테고리별 태그 조회
  @Query(
      """
         select new com.B108.tripwish.domain.review.dto.ReviewTagDto(
             t.id, t.category.id, t.content
         )
         from ReviewTag t
         where t.category.id in :categoryIds
         order by case when t.category.id = :selectedCategoryId then 0 else 1 end, t.id
         """)
  List<ReviewTagDto> findDtosByCategoryIdsOrdered(
      @Param("categoryIds") Collection<Long> categoryIds,
      @Param("selectedCategoryId") Long selectedCategoryId);
}
