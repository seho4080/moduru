package com.B108.tripwish.domain.room.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.B108.tripwish.domain.room.dto.request.UpdateTravelRoomRequestDto;
import com.B108.tripwish.domain.room.dto.response.TravelRoomResponseDto;
import com.B108.tripwish.domain.room.entity.TravelRoom;

@Mapper(componentModel = "spring")
public interface TravelRoomMapper {

  @Mapping(source = "roomId", target = "travelRoomId")
  TravelRoomResponseDto toDto(TravelRoom room);

  TravelRoom toEntity(UpdateTravelRoomRequestDto dto);

  @Mapping(target = "roomId", ignore = true) // ID는 수정 안 함
  void updateFromDto(UpdateTravelRoomRequestDto dto, @MappingTarget TravelRoom room);
}
