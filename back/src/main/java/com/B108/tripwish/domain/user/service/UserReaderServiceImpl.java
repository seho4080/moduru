package com.B108.tripwish.domain.user.service;

import org.springframework.stereotype.Service;

import com.B108.tripwish.domain.user.entity.User;
import com.B108.tripwish.domain.user.repository.UserRepository;
import com.B108.tripwish.global.exception.CustomException;
import com.B108.tripwish.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserReaderServiceImpl implements UserReaderService {

  private final UserRepository userRepository;

  @Override
  public User findById(Long userId) {
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    return user;
  }

  @Override
  public User getReference(Long userId) {
    return userRepository.getReferenceById(userId);
  }
}
