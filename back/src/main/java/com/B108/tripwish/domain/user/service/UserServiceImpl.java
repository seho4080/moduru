package com.B108.tripwish.domain.user.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.B108.tripwish.domain.user.dto.SignUpRequestDto;
import com.B108.tripwish.domain.user.dto.UpdateUserRequestDto;
import com.B108.tripwish.domain.user.entity.User;
import com.B108.tripwish.domain.user.repository.UserRepository;
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

  @Transactional
  @Override
  public void addUser(SignUpRequestDto request) {

    if (userRepository.existsByEmail(request.getEmail())) {
      throw new CustomException(ErrorCode.EXISTS_EMAIL); // 또는 적절한 예외 처리
    }

    User user =
        User.builder()
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
  public void updateUser(Long userId, UpdateUserRequestDto request) {
    User currentUser = getCurrentUser();

    // 권한 확인: 로그인 사용자와 PathVariable ID 비교
    if (!currentUser.getId().equals(userId)) {
      throw new CustomException(ErrorCode.UNAUTHORIZED_ACCESS);
    }

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
  public void deleteUser(Long userId) {
    User currentUser = getCurrentUser();

    // 권한 확인
    if (!currentUser.getId().equals(userId)) {
      throw new CustomException(ErrorCode.UNAUTHORIZED_ACCESS);
    }

    userRepository.delete(currentUser);
  }

  // 현재 로그인한 사용자
  private User getCurrentUser() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String currentEmail = authentication.getName(); // JWT에서 추출된 username(email)
    return userRepository
        .findByEmail(currentEmail)
        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
  }
}
