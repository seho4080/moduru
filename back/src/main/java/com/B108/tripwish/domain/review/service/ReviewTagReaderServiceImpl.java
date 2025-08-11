package com.B108.tripwish.domain.review.service;

import org.springframework.stereotype.Service;

import com.B108.tripwish.domain.review.entity.ReviewTag;
import com.B108.tripwish.domain.review.repository.ReviewTagRepository;
import com.B108.tripwish.global.exception.CustomException;
import com.B108.tripwish.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReviewTagReaderServiceImpl implements ReviewTagReaderService {

  private final ReviewTagRepository reviewTagRepository;

  @Override
  public ReviewTag findTagById(Long tagId) {
    return reviewTagRepository
        .findById(tagId)
        .orElseThrow(() -> new CustomException(ErrorCode.REVIEW_TAG_NOT_FOUND));
  }
}
