package com.B108.tripwish.domain.schedule.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.B108.tripwish.domain.schedule.entity.ScheduleEvent;

public interface ScheduleEventRepository extends JpaRepository<ScheduleEvent, Long> {

  @Query(
      "SELECT e FROM ScheduleEvent e "
          + "JOIN FETCH e.wantPlace wp "
          + "WHERE e.schedule.id = :scheduleId")
  List<ScheduleEvent> findAllBySchedulesIdWithWantPlace(@Param("scheduleId") Long scheduleId);
}
