package com.B108.tripwish.domain.review.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "place_review_tags")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class PlaceReviewTag {

  @EmbeddedId private PlaceReviewTagId id; // reviewId + tagId 복합키

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "tag_id", insertable = false, updatable = false)
  private ReviewTag tag; // ReviewTag는 필요 시 유지 (태그 내용 조회용)
}
