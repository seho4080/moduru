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

  @MapsId("tagId") // NOTE: EmbeddedId의 tagId 필드와 연관관계 연결
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "tag_id") // insertable/updatable 속성 제거
  private ReviewTag tag;
}
