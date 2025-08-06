package com.B108.tripwish.domain.room.service;

import com.B108.tripwish.domain.room.entity.TravelMember;
import com.B108.tripwish.domain.room.entity.TravelRoom;
import com.B108.tripwish.domain.user.entity.User;

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
    boolean existsUser(Long userId, Long roomId);

    void travelMemeberSave(TravelMember tm);

    TravelRoom findById(Long roomId);

    List<User> findUsersByRoomId(Long roomId);
}
