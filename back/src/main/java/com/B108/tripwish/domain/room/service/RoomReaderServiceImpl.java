package com.B108.tripwish.domain.room.service;

import com.B108.tripwish.domain.room.entity.TravelMember;
import com.B108.tripwish.domain.room.repository.TravelMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomReaderServiceImpl implements RoomReaderService {

    private final TravelMemberRepository travelMemberRepository;

    @Transactional(readOnly = true)
    @Override
    public List<RoomView> getRoomsByUserId(Long userId) {
        return travelMemberRepository.findAll().stream()
                .filter(member -> member.getUser().getId().equals(userId))
                .map(TravelMember::getTravelRoom)
                .distinct()
                .map(room -> (RoomView) new RoomView() { // 익명 구현체를 생성해 반환
                    @Override public Long getRoomId() { return room.getId(); }
                    @Override public String getTitle() { return room.getTitle(); }
                    @Override public String getRegion() { return room.getRegion(); }
                    @Override public java.time.LocalDate getStartDate() { return room.getStartDate(); }
                    @Override public java.time.LocalDate getEndDate() { return room.getEndDate(); }
                    @Override public java.time.LocalDateTime getCreatedAt() { return room.getCreatedAt(); }
                    @Override public List<String> getMembers() {
                        return room.getTravelMembers().stream()
                                .map(m -> m.getUser().getNickname())
                                .toList();
                    }
                })
                .toList();
    }
}
