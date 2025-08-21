package com.B108.tripwish.global.common.entity;

import java.util.ArrayList;
import java.util.List;

import com.B108.tripwish.domain.place.entity.Place;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "regions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Region {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "name", nullable = false)
  private String name;

  // 최상위(도 단위)는 null
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "parent_id")
  private Region parent;

  @Column(name = "lat", nullable = false)
  private Double lat;

  @Column(name = "lng", nullable = false)
  private Double lng;

  @OneToMany(mappedBy = "regionId", orphanRemoval = false) // Place의 필드명(regionId)과 일치해야 함
  @Builder.Default
  private List<Place> places = new ArrayList<>();
}
