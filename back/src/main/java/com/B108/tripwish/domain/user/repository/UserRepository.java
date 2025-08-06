package com.B108.tripwish.domain.user.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.B108.tripwish.domain.user.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
  Optional<User> findByEmail(String email);

  Optional<User> findById(Long id);
  Optional<User> findByUuid(UUID uuid);

  boolean existsByEmail(String email);

  boolean existsByNickname(String nickname);


}
