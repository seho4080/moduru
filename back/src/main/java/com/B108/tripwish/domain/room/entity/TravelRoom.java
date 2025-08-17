package com.B108.tripwish.domain.room.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;

import com.B108.tripwish.global.common.entity.Region;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "travel_rooms")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class TravelRoom {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id")
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "region_id", nullable = true)
  private Region region;

  @Column(name = "title", nullable = true)
  private String title;

  @Column(name = "start_date", nullable = true)
  private LocalDate startDate;

  @Column(name = "end_date", nullable = true)
  private LocalDate endDate;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @OneToMany(mappedBy = "travelRoom", cascade = CascadeType.REMOVE, orphanRemoval = true)
  private List<TravelMember> travelMembers;

  @PrePersist
  protected void onCreate() {
    this.createdAt = LocalDateTime.now();
  }
}
