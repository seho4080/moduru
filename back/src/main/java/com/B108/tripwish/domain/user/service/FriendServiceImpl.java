package com.B108.tripwish.domain.user.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.user.dto.response.FriendResponseDto;
import com.B108.tripwish.domain.user.entity.Friend;
import com.B108.tripwish.domain.user.entity.User;
import com.B108.tripwish.domain.user.repository.FriendRepository;
import com.B108.tripwish.domain.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FriendServiceImpl implements FriendService {

  private final FriendRepository friendRepository;
  private final UserRepository userRepository;

  @Override
  @Transactional
  public void addFriend(CustomUserDetails currentUser, Long friendId) {
    User user =
        userRepository
            .findByEmail(currentUser.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found"));

    User friend =
        userRepository
            .findById(friendId)
            .orElseThrow(() -> new RuntimeException("Friend not found"));

    if (friendRepository.existsByUserAndFriend(user, friend)) {
      throw new RuntimeException("이미 친구 상태입니다.");
    }

    friendRepository.save(Friend.builder().user(user).friend(friend).build());
    friendRepository.save(Friend.builder().user(friend).friend(user).build());
  }

  @Override
  @Transactional
  public void removeFriend(CustomUserDetails currentUser, Long friendId) {
    User user =
        userRepository
            .findByEmail(currentUser.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found"));
    User friend =
        userRepository
            .findById(friendId)
            .orElseThrow(() -> new RuntimeException("Friend not found"));

    friendRepository.deleteByUserAndFriend(user, friend);
    friendRepository.deleteByUserAndFriend(friend, user);
  }

  @Override
  @Transactional(readOnly = true)
  public List<FriendResponseDto> getFriends(CustomUserDetails currentUser) {
    User user =
        userRepository
            .findByEmail(currentUser.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found"));

    return friendRepository.findByUser(user).stream()
        .map(
            f ->
                FriendResponseDto.builder()
                    .friendId(f.getFriend().getId())
                    .nickname(f.getFriend().getNickname())
                    .profileImg(f.getFriend().getProfileImg())
                    .email(f.getFriend().getEmail())
                    .build())
        .toList();
  }
}
