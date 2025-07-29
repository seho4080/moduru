package com.B108.tripwish.domain.user.repository;


import com.B108.tripwish.domain.user.entity.UserToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserTokenRepository extends JpaRepository<UserToken, Long> {
    Optional<UserToken> findByRefreshToken(String refreshToken);
    void deleteByUserId(Long userId);

}

