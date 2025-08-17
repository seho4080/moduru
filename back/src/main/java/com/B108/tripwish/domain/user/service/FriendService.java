package com.B108.tripwish.domain.user.service;

import java.util.List;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.user.dto.response.FriendResponseDto;

public interface FriendService {
  void addFriend(CustomUserDetails currentUser, Long friendId);

  void removeFriend(CustomUserDetails currentUser, Long friendId);

  List<FriendResponseDto> getFriends(CustomUserDetails currentUser);
}
