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

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("reviewId")
    @JoinColumn(name = "review_id")
    private Review review;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("tagId")
    @JoinColumn(name = "tag_id")
    private ReviewTag tag;
}

