package com.B108.tripwish.domain.room.repository;

import java.util.List;
import java.util.Optional;

import com.B108.tripwish.domain.room.entity.TravelMemberId;
import org.springframework.data.jpa.repository.JpaRepository;

import com.B108.tripwish.domain.room.entity.TravelMember;

public interface TravelMemberRepository extends JpaRepository<TravelMember, Long> {
  Optional<TravelMember> findByUser_IdAndTravelRoom_Id(Long userId, Long travelRoomId);
  Optional<TravelMember> findByUser_Id(Long userId);

  boolean existsById(TravelMemberId travelMemberId);
}
