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

  @Column(length = 500)
  private String tel;

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

  @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<RestaurantMenu> menus = new ArrayList<>();
}
