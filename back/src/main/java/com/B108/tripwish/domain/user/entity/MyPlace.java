package com.B108.tripwish.domain.user.entity;

import java.time.LocalDateTime;

import com.B108.tripwish.domain.place.entity.Place;

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
  @MapsId("userId") // TravelMemberId.userId 와 매핑
  @JoinColumn(name = "user_id")
  private User user;

  @ManyToOne(fetch = FetchType.LAZY)
  @MapsId("placeId") // TravelMemberId.roomId 와 매핑
  @JoinColumn(name = "place_id")
  private Place place;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @PrePersist
  public void prePersist() {
    this.createdAt = LocalDateTime.now();
  }
}
