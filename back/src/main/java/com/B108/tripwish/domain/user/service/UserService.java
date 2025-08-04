package com.B108.tripwish.domain.user.service;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.user.dto.request.SignUpRequestDto;
import com.B108.tripwish.domain.user.dto.request.UpdateUserRequestDto;
import com.B108.tripwish.domain.user.dto.response.InfoUserResponseDto;
import com.B108.tripwish.domain.user.dto.response.UserTravelRoomResponseDto;

import java.util.List;

public interface UserService {
  void addUser(SignUpRequestDto request);

  InfoUserResponseDto getUserInfo(CustomUserDetails currentUser);

  void updateUser(CustomUserDetails currentUser, UpdateUserRequestDto request);

  void deleteUser(CustomUserDetails currentUser);

  List<UserTravelRoomResponseDto> getUserTravelRooms(CustomUserDetails currentUser);


}
