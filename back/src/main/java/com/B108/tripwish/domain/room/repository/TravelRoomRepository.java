package com.B108.tripwish.domain.room.repository;

import com.B108.tripwish.domain.room.dto.response.TravelRoomResponseDto;
import com.B108.tripwish.domain.room.entity.TravelRoom;
import com.B108.tripwish.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TravelRoomRepository extends JpaRepository<TravelRoom, Long> {

    Optional<TravelRoom> findByRoomId(Long roomId);

    void deleteByRoomId(Long roomId);


}
