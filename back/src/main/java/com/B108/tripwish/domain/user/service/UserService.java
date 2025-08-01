package com.B108.tripwish.domain.user.service;

import com.B108.tripwish.domain.user.dto.SignUpRequestDto;
import com.B108.tripwish.domain.user.dto.UpdateUserRequestDto;

public interface UserService {
  void addUser(SignUpRequestDto request);

  void updateUser(Long userId, UpdateUserRequestDto request);

  void deleteUser(Long userId);
}
