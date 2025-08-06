package com.B108.tripwish.domain.user.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.B108.tripwish.domain.user.entity.Friend;
import com.B108.tripwish.domain.user.entity.User;
import com.B108.tripwish.domain.user.repository.FriendRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FriendReaderServiceImpl implements FriendReaderService {

  private final FriendRepository friendRepository;

  @Override
  public List<Friend> findByUser(User user) {
    return friendRepository.findByUser(user);
  }
}
