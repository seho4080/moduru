package com.B108.tripwish.domain.user.service;

import com.B108.tripwish.domain.user.dto.SignUpRequestDto;

public interface UserService {
  void addUser(SignUpRequestDto request);
}
