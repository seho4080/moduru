package com.B108.tripwish.domain.user.service;

import com.B108.tripwish.domain.user.entity.User;

public interface UserReaderService {
    User findById(Long userId);
}
