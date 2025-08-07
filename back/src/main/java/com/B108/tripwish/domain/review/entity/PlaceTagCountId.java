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
public class PlaceTagCountId implements Serializable {
  private Long placeId;
  private Long tagId;
}
