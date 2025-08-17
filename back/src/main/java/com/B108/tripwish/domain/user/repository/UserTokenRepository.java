package com.B108.tripwish.domain.user.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.B108.tripwish.domain.user.entity.UserToken;

public interface UserTokenRepository extends JpaRepository<UserToken, Long> {
  Optional<UserToken> findByRefreshToken(String refreshToken);

  void deleteByUserId(Long userId);
}
