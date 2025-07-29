package com.B108.tripwish.domain.room.entity;

import com.B108.tripwish.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import lombok.*;

@Entity
@Table(name = "place_votes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaceVote {

    @EmbeddedId
    private PlaceVoteId id;

    @MapsId("wantId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "want_id")
    private PlaceWant placeWant;

    @MapsId("userId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private boolean vote;
}


