package com.B108.tripwish.domain.schedule.entity;

import com.B108.tripwish.domain.room.entity.WantPlace;
import com.B108.tripwish.global.common.enums.PlaceType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "schedule_events")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ScheduleEvent{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "schedule_id", nullable = false)
    private Schedule schedule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "want_id", nullable = false)
    private WantPlace wantPlace;

    @Column(name = "day", nullable = false)
    private int day; // 일정  day 순서

    @Column(name = "date", nullable = false)
    private LocalDate date; // 여행 날짜

    @Column(name = "next_travel_time", nullable = true)
    private Integer nextTravelTime;

    @Column(name ="start_time", nullable = true)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = true)
    private LocalTime endTime;

    @Column(name = "event_order", nullable = false)
    private int eventOrder;

    @Column(name = "memo", nullable = true)
    private String memo;


}
