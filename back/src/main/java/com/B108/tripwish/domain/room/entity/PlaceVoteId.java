package com.B108.tripwish.domain.room.entity;

import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@Embeddable
public class PlaceVoteId implements Serializable {
    // equals, hashCode는 @EqualsAndHashCode로 자동 생성됨

    private Long wantId;
    private Long userId;

}
