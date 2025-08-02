package com.B108.tripwish.domain.auth.service;

import java.util.Collection;
import java.util.Collections;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.B108.tripwish.domain.user.entity.User;

import lombok.Getter;

@Getter
public class CustomUserDetails implements UserDetails {

  private final User user;

  public CustomUserDetails(User user) {
    if (user == null) {
      System.out.println("[!] user is NULL in CustomUserDetails constructor");
    }
    this.user = user;
  }

  @Override
  public Collection<? extends GrantedAuthority> getAuthorities() {
    // 기본 권한 ROLE_USER 제공 (추후 DB에서 불러오게 수정 가능)
    return Collections.singleton(() -> "ROLE_USER");
  }

  @Override
  public String getPassword() {
    return user.getPassword(); // 반드시 암호화된 비밀번호
  }

  @Override
  public String getUsername() {
    return user.getEmail(); // 로그인 시 사용하는 고유 식별자
  }

  @Override
  public boolean isAccountNonExpired() {
    return true; // 계정 만료 여부 (추후 상태 컬럼으로 제어 가능)
  }

  @Override
  public boolean isAccountNonLocked() {
    return true; // 계정 잠김 여부
  }

  @Override
  public boolean isCredentialsNonExpired() {
    return true; // 비밀번호 만료 여부
  }

  @Override
  public boolean isEnabled() {
    return true; // 계정 활성화 여부
  }
}
