package com.B108.tripwish.domain.schedule.repository;

import com.B108.tripwish.domain.schedule.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    Optional<Schedule> findByRoomId(Long roomId);

}
