package com.B108.tripwish.domain.place.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "restaurants")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Restaurant {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "place_id", nullable = false, unique = true)
  private Place place;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Column(name = "description_short", columnDefinition = "TEXT")
  private String descriptionShort;

  @Column(length = 100)
  private String tel;

  @Column(length = 100)
  private String homepage;

  @Column(name = "business_hours", length = 100)
  private String businessHours;

  @Column(name = "rest_date", length = 100)
  private String restDate;

  @Column(length = 100)
  private String parking;

  @Column(length = 30)
  private String price;

  @OneToMany(mappedBy = "restaurants", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<RestaurantMenu> menus = new ArrayList<>();
}
