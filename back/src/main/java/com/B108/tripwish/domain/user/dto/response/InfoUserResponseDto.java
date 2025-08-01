package com.B108.tripwish.domain.user.dto.response;

import com.B108.tripwish.domain.user.entity.User;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class InfoUserResponseDto {

    private Long id;
    private String email;
    private String nickname;
    private String phone;
    private String profileImg;
    private String gender;
    private String birth;
    private String provider;
    private String role;

    public InfoUserResponseDto(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.nickname = user.getNickname();
        this.phone = user.getPhone();
        this.profileImg = user.getProfileImg();
        this.gender = user.getGender() != null ? user.getGender().name() : null;
        this.birth = user.getBirth() != null ? user.getBirth().toString() : null;
        this.provider = user.getProvider();
        this.role = user.getRole() != null ? user.getRole().name() : null;
    }
}