package com.B108.tripwish.domain.room.entity;

import java.time.LocalDateTime;

import com.B108.tripwish.global.common.enums.PlaceType;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "want_places")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class WantPlace {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id")
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "room_id", nullable = false)
  private TravelRoom travelRoom;

  @Enumerated(EnumType.STRING )
  @Column(nullable = false, length = 50)
  private PlaceType type;

  // 실제 장소 ID (place.id 또는 custom_place.id)
  @Column(name = "ref_id", nullable = false)
  private Long refId;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @PrePersist
  protected void onCreate() {
    this.createdAt = LocalDateTime.now();
  }
}
