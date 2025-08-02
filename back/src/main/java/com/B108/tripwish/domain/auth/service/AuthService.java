package com.B108.tripwish.domain.auth.service;

import com.B108.tripwish.domain.auth.dto.JwtToken;

public interface AuthService {
  JwtToken login(String email, String password);

  void logout(String accessToken);

  JwtToken reissue(String refreshToken);
}
