package com.B108.tripwish.domain.user.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "my_places")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class MyPlace {

  @EmbeddedId
  @AttributeOverrides({
          @AttributeOverride(name = "userId", column = @Column(name = "user_id")),
          @AttributeOverride(name = "placeId", column = @Column(name = "place_id"))
  })
  private MyPlaceId id;

  @ManyToOne(fetch = FetchType.LAZY)
  @MapsId("userId")
  @JoinColumn(name = "user_id")
  private User user;

  // ✅ Place 연관관계 제거, placeId 필드 추가
  @Column(name = "place_id", nullable = false, insertable = false, updatable = false)
  private Long placeId;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @PrePersist
  public void prePersist() {
    this.createdAt = LocalDateTime.now();
  }
}
