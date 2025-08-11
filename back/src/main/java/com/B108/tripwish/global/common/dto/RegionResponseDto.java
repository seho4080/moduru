package com.B108.tripwish.global.common.dto;

import com.B108.tripwish.global.common.entity.Region;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RegionResponseDto {
    private Long id;
    private String name;
    private Double lat;
    private Double lng;
    private Long parentId;

    public static RegionResponseDto from(Region r) {
        return RegionResponseDto.builder()
                .id(r.getId())
                .name(r.getName())
                .lat(r.getLat())
                .lng(r.getLng())
                .parentId(r.getParent() == null ? null : r.getParent().getId())
                .build();
    }
}
