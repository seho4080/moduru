package com.B108.tripwish.domain.room.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.B108.tripwish.domain.room.dto.request.UpdateTravelRoomRequestDto;
import com.B108.tripwish.domain.room.dto.response.TravelRoomResponseDto;
import com.B108.tripwish.domain.room.entity.TravelRoom;

@Mapper(componentModel = "spring")
public interface TravelRoomMapper {

  @Mapping(source = "id", target = "travelRoomId")
  @Mapping(source = "region.name", target = "region")
  TravelRoomResponseDto toDto(TravelRoom room);

  @Mapping(target = "region", ignore = true)
  TravelRoom toEntity(UpdateTravelRoomRequestDto dto);

  @Mapping(target = "id", ignore = true) // ID는 수정 안 함
  @Mapping(target = "region", ignore = true)
  void updateFromDto(UpdateTravelRoomRequestDto dto, @MappingTarget TravelRoom room);
}
