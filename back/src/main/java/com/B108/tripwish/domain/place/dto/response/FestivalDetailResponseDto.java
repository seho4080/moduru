package com.B108.tripwish.domain.place.dto.response;

import lombok.*;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FestivalDetailResponseDto implements CategoryDetailResponseDto{
    private String description;
    private String descriptionShort;
    private String infoCenter;
    private String homepage;
    private String period;
    private String organizer;
    private String sns;

}
