package com.B108.tripwish.domain.user.service;

import java.util.List;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.room.service.RoomReaderService;
import com.B108.tripwish.domain.user.dto.request.SignUpRequestDto;
import com.B108.tripwish.domain.user.dto.request.UpdateUserRequestDto;
import com.B108.tripwish.domain.user.dto.response.InfoUserResponseDto;
import com.B108.tripwish.domain.user.dto.response.UserTravelRoomResponseDto;
import com.B108.tripwish.domain.user.entity.User;
import com.B108.tripwish.domain.user.repository.UserRepository;
import com.B108.tripwish.domain.user.repository.UserTokenRepository;
import com.B108.tripwish.global.exception.CustomException;
import com.B108.tripwish.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

  private final PasswordEncoder passwordEncoder;
  private final UserRepository userRepository;
  private final UserTokenRepository userTokenRepository;
  private final RoomReaderService roomReaderService;

  @Transactional
  @Override
  public void addUser(SignUpRequestDto request) {
    if (userRepository.existsByEmail(request.getEmail())) {
      throw new CustomException(ErrorCode.EXISTS_EMAIL);
    }
    User user =
        User.builder()
            .uuid(UUID.randomUUID())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .provider(request.getProvider())
            .nickname(request.getNickname())
            .gender(request.getGender())
            .birth(request.getBirth())
            .phone(request.getPhone())
            .profileImg("profile_basic.png")
            .role(User.Role.ROLE_USER)
            .build();
    userRepository.save(user);
  }

  @Transactional
  @Override
  public void updateUser(CustomUserDetails currentUserDetails, UpdateUserRequestDto request) {
    User currentUser =
        userRepository
            .findById(currentUserDetails.getUser().getId())
            .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

    if (request.getNickname() != null && !request.getNickname().isBlank()) {
      currentUser.setNickname(request.getNickname());
    }
    if (request.getPassword() != null && !request.getPassword().isBlank()) {
      currentUser.setPassword(passwordEncoder.encode(request.getPassword()));
    }
    if (request.getPhone() != null) {
      currentUser.setPhone(request.getPhone());
    }
    if (request.getProfileImg() != null) {
      currentUser.setProfileImg(request.getProfileImg());
    }
    userRepository.save(currentUser);
  }

  @Transactional
  @Override
  public void deleteUser(CustomUserDetails currentUserDetails) {
    User currentUser =
        userRepository
            .findById(currentUserDetails.getUser().getId())
            .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

    userTokenRepository.deleteByUserId(currentUser.getId());
    userRepository.delete(currentUser);
  }

  @Transactional(readOnly = true)
  @Override
  public InfoUserResponseDto getUserInfo(CustomUserDetails currentUserDetails) {
    User user =
        userRepository
            .findById(currentUserDetails.getUser().getId())
            .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    return new InfoUserResponseDto(user);
  }

  // 유저가 속한 여행 방 목록 조회
  @Transactional(readOnly = true)
  @Override
  public List<UserTravelRoomResponseDto> getUserTravelRooms(CustomUserDetails currentUser) {
    Long userId = currentUser.getUser().getId();

    userRepository
        .findById(userId)
        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

    // roomReaderService는 RoomView 인터페이스를 반환
    List<RoomReaderService.RoomView> rooms = roomReaderService.getRoomsByUserId(userId);

    return rooms.stream()
        .map(
            room ->
                UserTravelRoomResponseDto.builder()
                    .travelRoomId(room.getRoomId())
                    .title(room.getTitle())
                    .region(room.getRegion())
                    .startDate(room.getStartDate())
                    .endDate(room.getEndDate())
                    .createdAt(room.getCreatedAt())
                    .members(room.getMembers())
                    .build())
        .toList();
  }
}
