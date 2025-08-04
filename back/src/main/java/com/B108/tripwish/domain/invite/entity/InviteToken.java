package com.B108.tripwish.domain.invite.entity;

import com.B108.tripwish.domain.room.entity.TravelRoom;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "invite_tokens")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class InviteToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;  // 초대 토큰 ID

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private TravelRoom room;  // 초대 대상 방

    @Column(nullable = false, unique = true)
    private String token;  // 초대 토큰 (UUID)

    @Column(nullable = false)
    private LocalDateTime val;  // 만료 시간
}
