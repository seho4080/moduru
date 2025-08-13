package com.B108.tripwish.domain.place.entity;

import java.util.ArrayList;
import java.util.List;

import com.B108.tripwish.global.common.entity.Region;
import jakarta.persistence.*;
import lombok.*;

import static jakarta.persistence.FetchType.LAZY;

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

  @ManyToOne
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

  @Column(name = "road_address_name", nullable = true, length = 500)
  private String roadAddressName; // 도로명 주소

  @Column(nullable = false)
  private Double lng; // 경도

  @Column(nullable = false)
  private Double lat; // 위도

  @OneToMany(mappedBy = "place", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<PlaceMetadataTag> metadataTags = new ArrayList<>();

  @OneToMany(mappedBy = "place", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<PlaceImage> images = new ArrayList<>();

}
