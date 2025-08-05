package com.B108.tripwish.domain.room.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.B108.tripwish.domain.room.entity.TravelMember;
import com.B108.tripwish.domain.room.entity.TravelMemberId;

public interface TravelMemberRepository extends JpaRepository<TravelMember, Long> {
  Optional<TravelMember> findByUser_IdAndTravelRoom_Id(Long userId, Long travelRoomId);

  Optional<TravelMember> findByUser_Id(Long userId);

  boolean existsById(TravelMemberId travelMemberId);
}
