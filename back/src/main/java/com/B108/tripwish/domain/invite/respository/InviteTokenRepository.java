package com.B108.tripwish.domain.invite.respository;

import com.B108.tripwish.domain.invite.entity.InviteToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InviteTokenRepository extends JpaRepository<InviteToken, Long> {
    Optional<InviteToken> findByToken(String token);
}
