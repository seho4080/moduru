package com.B108.tripwish.domain.user.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(unique = true, nullable = false, updatable = false)
  private UUID uuid;

  @Column(length = 100, unique = true)
  private String email;

  @Column private String password;

  @Column(nullable = false)
  private String provider;

  @Column(length = 50, nullable = false)
  private String nickname;

  @Column(columnDefinition = "TEXT")
  private String profileImg;

  @Enumerated(EnumType.STRING)
  private Gender gender;

  private LocalDate birth;

  @CreationTimestamp
  @Column(nullable = false)
  private LocalDateTime createdAt;

  @Column private String phone;

  @Enumerated(EnumType.STRING)
  @Column(name = "role", nullable = false)
  private Role role;

  public enum Gender {
    M,
    F,
    O
  }

  public enum Role {
    ROLE_USER,
    ROLE_ADMIN
  }
}
