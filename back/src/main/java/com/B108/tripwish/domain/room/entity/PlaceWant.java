package com.B108.tripwish.domain.room.entity;

import java.time.LocalDateTime;

import com.B108.tripwish.domain.place.entity.Place;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "want_places")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaceWant {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "want_id")
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "place_id", nullable = false)
  private Place place;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "room_id", nullable = false)
  private TravelRoom travelRoom;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @PrePersist
  protected void onCreate() {
    this.createdAt = LocalDateTime.now();
  }
}
