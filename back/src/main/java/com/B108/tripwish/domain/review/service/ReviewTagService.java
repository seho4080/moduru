package com.B108.tripwish.domain.review.service;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.B108.tripwish.domain.review.dto.ReviewTagDto;
import com.B108.tripwish.domain.review.repository.ReviewTagRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReviewTagService {
  private static final long COMMON_CATEGORY_ID = 4L;
  private final ReviewTagRepository reviewTagRepository;

  @Transactional(readOnly = true)
  public List<ReviewTagDto> getTagsByCategoryIncludingCommon(Long categoryId) {
    // 입력값 + 공통(4) 중복 없이 유지
    Set<Long> ids = new LinkedHashSet<>();
    ids.add(categoryId);
    if (categoryId == null || categoryId != COMMON_CATEGORY_ID) {
      ids.add(COMMON_CATEGORY_ID);
    }

    return reviewTagRepository.findDtosByCategoryIdsOrdered(ids, categoryId);
  }
}
