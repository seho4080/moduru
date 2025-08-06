package com.B108.tripwish.domain.room.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.B108.tripwish.domain.room.entity.TravelRoom;

public interface TravelRoomRepository extends JpaRepository<TravelRoom, Long> {

  Optional<TravelRoom> findById(Long roomId);

  void deleteById(Long roomId);
}
