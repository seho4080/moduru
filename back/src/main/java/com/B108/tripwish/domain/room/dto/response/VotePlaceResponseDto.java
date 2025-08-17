package com.B108.tripwish.domain.room.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VotePlaceResponseDto {
    private Long wantId;

    @JsonProperty("isVoted")
    private boolean isVoted;
}
