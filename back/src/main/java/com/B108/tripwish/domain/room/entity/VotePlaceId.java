package com.B108.tripwish.domain.room.entity;

import java.io.Serializable;

import jakarta.persistence.Embeddable;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@Embeddable
public class VotePlaceId implements Serializable {
  // equals, hashCode는 @EqualsAndHashCode로 자동 생성됨

  private Long wantId;
  private Long userId;
}
