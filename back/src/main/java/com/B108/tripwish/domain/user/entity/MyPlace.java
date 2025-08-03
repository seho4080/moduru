package com.B108.tripwish.domain.user.entity;

import com.B108.tripwish.domain.place.entity.Place;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "my_places")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class MyPlace {

    @EmbeddedId
    private MyPlaceId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("placeId") // TravelMemberId.roomId 와 매핑
    @JoinColumn(name = "place_id")
    private Place place;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId") // TravelMemberId.userId 와 매핑
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
