package com.B108.tripwish.domain.review.service;

import java.util.List;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.review.dto.request.CreateReviewRequestDto;
import com.B108.tripwish.domain.review.dto.response.ReviewResponseDto;

public interface ReviewService {
  List<String> getTagNamesByPlaceId(Long placeId);

  void createReview(CustomUserDetails currentUser, CreateReviewRequestDto request);

  void deleteMyReview(CustomUserDetails currentUser, Long reviewId);

  List<ReviewResponseDto> getMyReviews(CustomUserDetails currentUser);
}
