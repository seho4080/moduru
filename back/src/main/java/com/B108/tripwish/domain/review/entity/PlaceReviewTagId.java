package com.B108.tripwish.domain.review.entity;

import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

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