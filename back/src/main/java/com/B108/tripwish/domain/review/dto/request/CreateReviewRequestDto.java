package com.B108.tripwish.domain.review.dto.request;

import java.util.List;

import lombok.Getter;

@Getter
public class CreateReviewRequestDto {
  private Long placeId;
  private List<Long> tagIds; // 선택된 태그 ID 목록
}
