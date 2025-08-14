package com.B108.tripwish.domain.review.entity;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class PlaceReviewTagId implements Serializable {
  private Long reviewId;
  private Long tagId;

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    PlaceReviewTagId that = (PlaceReviewTagId) o;
    return Objects.equals(reviewId, that.reviewId) && Objects.equals(tagId, that.tagId);
  }

  @Override
  public int hashCode() {
    return Objects.hash(reviewId, tagId);
  }
}
