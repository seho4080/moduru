package com.B108.tripwish.domain.review.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "place_tag_counts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class PlaceTagCount {

  @EmbeddedId private PlaceTagCountId id;

  @Column(name = "tag_count", nullable = false)
  private int tagCount;

  public void increment() {
    this.tagCount++;
  }

  public void decrement() {
    if (this.tagCount > 0) this.tagCount--;
  }
}
