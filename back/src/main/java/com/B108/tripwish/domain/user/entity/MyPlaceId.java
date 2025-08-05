package com.B108.tripwish.domain.user.entity;

import java.io.Serializable;

import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable
@Getter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class MyPlaceId implements Serializable {

  private Long userId;
  private Long placeId;
}
