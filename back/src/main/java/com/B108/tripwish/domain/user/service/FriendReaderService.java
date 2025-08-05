package com.B108.tripwish.domain.user.service;

import java.util.List;

import com.B108.tripwish.domain.user.entity.Friend;
import com.B108.tripwish.domain.user.entity.User;

public interface FriendReaderService {
  List<Friend> findByUser(User user);
}
