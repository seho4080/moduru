package com.B108.tripwish.domain.room.dto.response;

import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TravelMemberListResponseDto {
    private List<TravelMemberDto> members;
}
