package com.B108.tripwish.domain.room.entity;

import java.io.Serializable;

import jakarta.persistence.Embeddable;
import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@Embeddable
public class TravelMemberId implements Serializable {

  private Long roomId;
  private Long userId;
}
