package com.B108.tripwish.domain.room.entity;

import com.B108.tripwish.domain.user.entity.User;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "travel_members")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class TravelMember {

  @EmbeddedId private TravelMemberId id;

  @ManyToOne(fetch = FetchType.LAZY)
  @MapsId("roomId") // TravelMemberId.roomId 와 매핑
  @JoinColumn(name = "room_id")
  private TravelRoom travelRoom;

  @ManyToOne(fetch = FetchType.LAZY)
  @MapsId("userId") // TravelMemberId.userId 와 매핑
  @JoinColumn(name = "user_id")
  private User user;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private TravelMemberRole role;

  @Builder
  public TravelMember(TravelRoom travelRoom, User user, TravelMemberRole role) {
    this.travelRoom = travelRoom;
    this.user = user;
    this.role = role;
    this.id = new TravelMemberId(travelRoom.getRoomId(), user.getId());
  }
}
