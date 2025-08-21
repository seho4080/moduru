package com.B108.tripwish.domain.place.entity;

import static jakarta.persistence.FetchType.LAZY;

import java.util.ArrayList;
import java.util.List;

import com.B108.tripwish.global.common.entity.Region;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "places")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Place {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = LAZY) // 기본 EAGER → LAZY 권장
  @JoinColumn(name = "category_id")
  private Category categoryId;

  @ManyToOne(fetch = LAZY)
  @JoinColumn(name = "region_id")
  private Region regionId;

  @Column(name = "kakao_id")
  private Long kakaoId;

  @Column(name = "place_name", length = 500)
  private String placeName;

  @Column(name = "place_url")
  private String placeUrl;

  @Column(name = "address_name", length = 500)
  private String addressName; // 지번 주소

  @Column(name = "road_address_name", nullable = false, length = 500)
  private String roadAddressName; // 도로명 주소

  @Column(nullable = false)
  private Double lng; // 경도

  @Column(nullable = false)
  private Double lat; // 위도

  @Builder.Default
  @OneToMany(mappedBy = "place", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<PlaceMetadataTag> metadataTags = new ArrayList<>();

  @Builder.Default
  @OneToMany(mappedBy = "place", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<PlaceImage> images = new ArrayList<>();
}
