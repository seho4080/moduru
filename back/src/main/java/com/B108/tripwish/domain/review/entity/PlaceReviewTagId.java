package com.B108.tripwish.domain.review.entity;

import java.io.Serializable;

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
}
