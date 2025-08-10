package com.B108.tripwish.domain.schedule.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import com.B108.tripwish.domain.room.entity.TravelRoom;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "schedules")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Schedule {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @OneToOne
  @JoinColumn(name = "room_id", unique = true)
  private TravelRoom room;

  @Column(name = "transport", nullable = true)
  private String transport;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @PrePersist
  protected void onCreate() {
    this.createdAt = LocalDateTime.now();
  }
}
