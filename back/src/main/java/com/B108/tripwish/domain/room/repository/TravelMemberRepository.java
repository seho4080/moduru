package com.B108.tripwish.domain.room.repository;

import com.B108.tripwish.domain.room.entity.TravelMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TravelMemberRepository extends JpaRepository<TravelMember, Long> {
    Optional<TravelMember> findByUser_IdAndTravelRoom_Id(Long userId, Long travelRoomId);


}
