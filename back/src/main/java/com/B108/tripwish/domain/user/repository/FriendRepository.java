package com.B108.tripwish.domain.user.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.B108.tripwish.domain.user.entity.Friend;
import com.B108.tripwish.domain.user.entity.User;

public interface FriendRepository extends JpaRepository<Friend, Long> {

  // 친구 목록 조회
  List<Friend> findByUser(User user);

  // 친구 관계가 존재하는지 확인
  boolean existsByUserAndFriend(User user, User friend);

  // 친구 관계 조회
  Optional<Friend> findByUserAndFriend(User user, User friend);

  // 친구 관계 삭제
  void deleteByUserAndFriend(User user, User friend);
}
