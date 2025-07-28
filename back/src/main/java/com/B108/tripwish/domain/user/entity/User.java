package com.B108.tripwish.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

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
    private Long userId;

    @Column(length = 100, unique = true)
    private String email;

    @Column
    private String password;

    @Column(nullable = false)
    private String provider;

    @Column(length = 50, nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String profileImage;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    private LocalDate birth;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private String phone;

    public enum Gender {
        M, F, O
    }
}
