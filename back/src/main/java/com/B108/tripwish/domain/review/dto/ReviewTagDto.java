package com.B108.tripwish.domain.review.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewTagDto {
  private Long id;
  private Long categoryId;
  private String content;
}
