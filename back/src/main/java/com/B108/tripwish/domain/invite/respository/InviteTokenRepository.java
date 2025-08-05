package com.B108.tripwish.domain.invite.respository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.B108.tripwish.domain.invite.entity.InviteToken;

public interface InviteTokenRepository extends JpaRepository<InviteToken, Long> {
  Optional<InviteToken> findByToken(String token);

  Optional<InviteToken> findByRoomId(Long roomId);
}
