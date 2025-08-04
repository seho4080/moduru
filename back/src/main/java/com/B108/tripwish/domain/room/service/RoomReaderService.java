package com.B108.tripwish.domain.room.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface RoomReaderService {
    List<RoomView> getRoomsByUserId(Long userId);

    interface RoomView {
        Long getRoomId();
        String getTitle();
        String getRegion();
        LocalDate getStartDate();
        LocalDate getEndDate();
        LocalDateTime getCreatedAt();
        List<String> getMembers();
    }
}