package com.B108.tripwish.domain.auth.service;

import java.io.Serializable;
import java.util.Collection;
import java.util.Collections;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.B108.tripwish.domain.user.entity.User;

import lombok.Getter;

@Getter
public class CustomUserDetails implements UserDetails, Serializable {

  private static final long serialVersionUID = 1L;

  private final User user;
  private final String uuid;

  public CustomUserDetails(User user) {
    if (user == null) {
      throw new IllegalArgumentException("user is null in CustomUserDetails");
    }
    this.user = user;
    this.uuid = user.getUuid().toString();
  }

  @Override
  public Collection<? extends GrantedAuthority> getAuthorities() {
    // TODO: 실제 권한 매핑 필요 시 수정
    return Collections.singleton(() -> "ROLE_USER");
  }

  @Override
  public String getPassword() {
    return user.getPassword(); // 암호화된 비밀번호
  }

  @Override
  public String getUsername() {
    return user.getEmail(); // 혹은 user.getUsername()
  }

  @Override
  public boolean isAccountNonExpired() {
    return true;
  }

  @Override
  public boolean isAccountNonLocked() {
    return true;
  }

  @Override
  public boolean isCredentialsNonExpired() {
    return true;
  }

  @Override
  public boolean isEnabled() {
    return true;
  }
}
