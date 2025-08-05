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

  @EmbeddedId
  private PlaceReviewTagId id;

  @Column(name = "review_id", insertable = false, updatable = false)
  private Long reviewId;  // Review 엔티티 대신 reviewId만 보관

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "tag_id", insertable = false, updatable = false)
  private ReviewTag tag;
}
