package com.B108.tripwish.domain.room.entity;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class TravelMemberId implements Serializable {

  private Long roomId;
  private Long userId;

  @Override
  public boolean equals(Object o) {
    if (this == o) return true; // 주소값이 같으면 비교할 필요 없이 true 반환
    if (!(o instanceof TravelMemberId)) return false; // 타입을 비교해서 다르면 false
    TravelMemberId that = (TravelMemberId) o;
    return Objects.equals(roomId, that.roomId)
        && // 여기까지 왔다면 실제 필드들끼리 값을 비교해서 같으면  true, 다르면 false
        Objects.equals(userId, that.userId);
  }

  @Override
  public int hashCode() {
    return Objects.hash(roomId, userId);
  }
}
