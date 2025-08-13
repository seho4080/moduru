package com.B108.tripwish.domain.review.entity;

import com.B108.tripwish.domain.place.entity.Category;
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

  // 연결된 카테고리 ID (ex: 맛집, 관광지, 축제 등)\
  // 태그는 하나의 카테고리에 속함
  // @Column(name = "category_id", nullable = false)
//  private Long categoryId;
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "category_id", nullable = false)
  private Category category;


  @Column(length = 255)
  private String content;
}
