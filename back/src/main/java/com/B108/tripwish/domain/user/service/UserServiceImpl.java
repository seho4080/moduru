package com.B108.tripwish.domain.user.service;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.user.dto.response.InfoUserResponseDto;
import com.B108.tripwish.domain.user.repository.UserTokenRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.B108.tripwish.domain.user.dto.request.SignUpRequestDto;
import com.B108.tripwish.domain.user.dto.request.UpdateUserRequestDto;
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
  private final UserTokenRepository userTokenRepository;

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
  public void updateUser(CustomUserDetails currentUserDetails, UpdateUserRequestDto request) {
    User currentUser = userRepository.findById(currentUserDetails.getUser().getId())
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
    User currentUser = userRepository.findById(currentUserDetails.getUser().getId())
            .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

    // UserToken 삭제
    userTokenRepository.deleteByUserId(currentUser.getId());

    userRepository.delete(currentUser);
  }


  @Transactional(readOnly = true)
  @Override
  public InfoUserResponseDto getUserInfo(CustomUserDetails currentUserDetails) {
    User user = userRepository.findById(currentUserDetails.getUser().getId())
            .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

    return new InfoUserResponseDto(user);
  }


}
