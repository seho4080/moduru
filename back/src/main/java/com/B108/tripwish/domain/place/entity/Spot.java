package com.B108.tripwish.domain.place.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "spots")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Spot {

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

  @Column(name = "info_center", length = 500)
  private String infoCenter;

  @Column(length = 500)
  private String homepage;

  @Column(name = "business_hours", length = 500)
  private String businessHours;

  @Column(name = "rest_date", length = 500)
  private String restDate;

  @Column(length = 500)
  private String parking;

  @Column(length = 500)
  private String price;
}
