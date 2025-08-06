package com.B108.tripwish.domain.review.service;

import com.B108.tripwish.domain.review.entity.ReviewTag;

public interface ReviewTagReaderService {
  ReviewTag findTagById(Long tagId);
}
