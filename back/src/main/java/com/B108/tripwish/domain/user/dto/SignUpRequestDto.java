package com.B108.tripwish.domain.user.dto;

import com.B108.tripwish.domain.user.entity.User;
import lombok.*;

import java.io.File;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SignUpRequestDto {
    private String email;
    private String password;
    private String provider;
    private String nickname;
    private User.Gender gender;
    private LocalDate birth;
    private String phone;

}
