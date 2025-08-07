package com.B108.tripwish.domain.room.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "custom_places")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class CustomPlace {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "room_id")
  private TravelRoom room;

  @Column(nullable = false, length = 100)
  private String name;

  @Column(nullable = false)
  private Double lat;

  @Column(nullable = false)
  private Double lng;

  @Column(nullable = false, length = 100)
  private String address;
}
