package com.B108.tripwish.domain.place.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "festivals")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Festival {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "place_id", nullable = false, unique = true)
  private Place placeId;

  @Column(name = "region_id", nullable = false)
  private Integer regionId;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Column(name = "description_short", columnDefinition = "TEXT")
  private String descriptionShort;

  @Column(length = 500)
  private String homepage;

  @Column(name = "info_center", length = 500)
  private String infoCenter;

  @Column(length = 500)
  private String period;

  @Column(length = 500)
  private String price;

  @Column(length = 500)
  private String organizer;

  @Column(length = 500)
  private String sns;
}
