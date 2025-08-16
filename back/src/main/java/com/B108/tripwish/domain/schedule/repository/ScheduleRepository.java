package com.B108.tripwish.domain.schedule.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.B108.tripwish.domain.schedule.entity.Schedule;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

  Optional<Schedule> findByRoomId(Long roomId);

  // 방의 "가장 최근 스케줄"에 포함된 PLACE 타입 장소의 (이름, 주소)
  @Query(value = """
        SELECT p.name, p.address
        FROM schedule_events se
        JOIN want_place wp ON wp.id = se.want_id
        JOIN place p       ON p.id  = wp.ref_id
        WHERE se.schedule_id = (
          SELECT id FROM schedule
          WHERE room_id = :roomId
          ORDER BY created_at DESC
          LIMIT 1
        )
          AND wp.type = 'PLACE'
        ORDER BY se.day, se.id
        """, nativeQuery = true)
  List<Object[]> findPlaceNameAddrOfLatestScheduleByRoomId(@Param("roomId") Long roomId);

  @Query(value = """
    WITH ranked AS (
      SELECT
          p.id                                       AS place_id,
          p.place_name                               AS place_name,
          COALESCE(p.road_address_name, p.address_name) AS address,
          se.day,
          se.event_order,
          se.id                                      AS event_id,
          ROW_NUMBER() OVER (
            PARTITION BY p.id
            ORDER BY se.day, se.event_order, se.id
          ) AS rn
      FROM schedules s
      JOIN schedule_events se ON se.schedule_id = s.id
      JOIN want_places wp     ON wp.id = se.want_id
      JOIN places p           ON p.id  = wp.ref_id
      WHERE s.room_id = :roomId
        AND wp.type = 'PLACE'
    )
    SELECT place_name, address
    FROM ranked
    WHERE rn = 1
    ORDER BY day, event_order, event_id
    """, nativeQuery = true)
  List<Object[]> findPlaceNameAddrByRoomId(@Param("roomId") Long roomId);

}
