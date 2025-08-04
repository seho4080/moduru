package com.B108.tripwish.domain.room.entity;

import com.B108.tripwish.domain.user.entity.User;

import jakarta.persistence.*;
import lombok.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "vote_places")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VotePlace {

  @EmbeddedId private VotePlaceId id;

  @MapsId("wantId")
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "want_id")
  private WantPlace wantPlace;

  @MapsId("userId")
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id")
  private User user;

  @Column(nullable = false)
  private boolean vote;
}
