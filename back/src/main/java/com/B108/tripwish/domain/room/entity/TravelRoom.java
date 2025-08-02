package com.B108.tripwish.domain.room.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "travel_rooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TravelRoom {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "room_id ")
  private Long id;

  @Column(name = "title", nullable = false)
  private String title;

  @Column(name = "region", nullable = true)
  private String region;

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
