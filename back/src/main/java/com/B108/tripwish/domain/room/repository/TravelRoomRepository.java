package com.B108.tripwish.domain.room.repository;

import com.B108.tripwish.domain.room.entity.TravelRoom;
import com.B108.tripwish.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TravelRoomRepository extends JpaRepository<TravelRoom, Long> {
}
