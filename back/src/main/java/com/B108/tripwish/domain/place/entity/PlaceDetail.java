package com.B108.tripwish.domain.place.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

@Entity
@Table(name = "prompt_else")
public class PlaceDetail {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private Long placeId;
  private Long categoryId;

  @Column(name = "detail_gpt", columnDefinition = "json")
  private String detailGPT; // 또는 JsonNode도 가능

  private LocalDateTime createdAt;
}
