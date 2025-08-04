package com.B108.tripwish.domain.user.dto.response;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserTravelRoomResponseDto {
    private Long travelRoomId;
    private String title;
    private String region;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDateTime createdAt;
    private List<String> members;




}
