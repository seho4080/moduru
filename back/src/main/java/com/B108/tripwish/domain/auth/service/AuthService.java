package com.B108.tripwish.domain.auth.service;

import com.B108.tripwish.domain.auth.dto.JwtToken;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public interface AuthService {
  JwtToken login(
      String email, String password, HttpServletResponse response, HttpServletRequest request);

  void logout(String accessToken);

  JwtToken reissue(String refreshToken, HttpServletResponse response, HttpServletRequest request);
}
