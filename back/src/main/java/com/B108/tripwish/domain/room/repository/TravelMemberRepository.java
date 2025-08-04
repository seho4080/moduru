package com.B108.tripwish.domain.room.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.B108.tripwish.domain.room.entity.TravelMember;

public interface TravelMemberRepository extends JpaRepository<TravelMember, Long> {
  Optional<TravelMember> findByUser_IdAndTravelRoom_RoomId(Long userId, Long travelRoomId);

  //유저가 속한 여행 방 조회용
  List<TravelMember> findByUser_Id(Long userId);
}
