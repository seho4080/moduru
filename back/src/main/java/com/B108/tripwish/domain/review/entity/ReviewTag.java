package com.B108.tripwish.domain.review.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "review_tags")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ReviewTag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 연결된 카테고리 ID (ex: 맛집, 관광지, 축제 등)
    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @Column(length = 255)
    private String content;
}
