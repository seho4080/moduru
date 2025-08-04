package com.B108.tripwish.domain.place.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ReviewTagResponseDto {
  private Long tagId;
  private String content;
}
