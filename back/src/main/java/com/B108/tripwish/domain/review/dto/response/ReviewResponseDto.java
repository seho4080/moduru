package com.B108.tripwish.domain.review.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class ReviewResponseDto {
  private Long reviewId;
  private Long placeId;
  private String placeName;
  private LocalDateTime createdAt;
  private List<String> tags;
}
