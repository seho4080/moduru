package com.B108.tripwish.domain.place.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "places")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Place {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "place_id")
    private Long placeId;

    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @Column(name = "place_k_id", nullable = false)
    private Long kakaoPlaceId;

    @Column(name = "address_1")
    private String address1;

    @Column(name = "address_2")
    private String address2;

    @Column(name = "region")
    private String region;

    @Column(name = "name")
    private String name;

    @Column(name = "latitude")
    private Float latitude;

    @Column(name = "longitude")
    private Float longitude;

    @Column(name = "tags")
    private String tags;

    @Column(name = "description")
    private String description;

    @Column(name = "image_url")
    private String imageUrl;
}
