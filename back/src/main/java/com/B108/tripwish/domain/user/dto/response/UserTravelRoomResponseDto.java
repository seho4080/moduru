package com.B108.tripwish.domain.user.dto.response;

import com.B108.tripwish.domain.room.entity.TravelRoom;
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
    private List<String> members; // 추가 필드

    public static UserTravelRoomResponseDto from(TravelRoom room, List<String> members) {
        return UserTravelRoomResponseDto.builder()
                .travelRoomId(room.getRoomId())
                .title(room.getTitle())
                .region(room.getRegion())
                .startDate(room.getStartDate())
                .endDate(room.getEndDate())
                .createdAt(room.getCreatedAt())
                .members(members)
                .build();
    }
}
