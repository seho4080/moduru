package com.B108.tripwish.domain.user.service;

import com.B108.tripwish.domain.user.entity.Friend;
import com.B108.tripwish.domain.user.entity.User;

import java.util.List;

public interface FriendReaderService {
    List<Friend> findByUser(User user);
}
