package com.B108.tripwish.domain.user.service;

import com.B108.tripwish.domain.user.entity.User;

public interface UserReaderService {
  User findById(Long userId);

  User getReference(Long userId); // Review 도메인에서 사용
}
