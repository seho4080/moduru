package com.B108.tripwish.domain.room.entity;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Embeddable;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@Embeddable
public class TravelMemberId implements Serializable {

  private Long roomId;
  private Long userId;

}
