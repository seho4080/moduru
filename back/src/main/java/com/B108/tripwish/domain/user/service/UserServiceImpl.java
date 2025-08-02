package com.B108.tripwish.domain.user.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.B108.tripwish.domain.user.dto.SignUpRequestDto;
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
}
