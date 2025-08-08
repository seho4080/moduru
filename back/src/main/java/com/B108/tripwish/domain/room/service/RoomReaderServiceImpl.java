package com.B108.tripwish.domain.room.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.B108.tripwish.domain.room.entity.TravelMember;
import com.B108.tripwish.domain.room.entity.TravelMemberId;
import com.B108.tripwish.domain.room.entity.TravelRoom;
import com.B108.tripwish.domain.room.repository.TravelMemberRepository;
import com.B108.tripwish.domain.room.repository.TravelRoomRepository;
import com.B108.tripwish.domain.user.entity.User;
import com.B108.tripwish.global.exception.CustomException;
import com.B108.tripwish.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RoomReaderServiceImpl implements RoomReaderService {

  private final TravelMemberRepository travelMemberRepository;
  private final TravelRoomRepository travelRoomRepository;

  @Transactional(readOnly = true)
  @Override
  public List<RoomView> getRoomsByUserId(Long userId) {
    return travelMemberRepository.findAll().stream()
        .filter(member -> member.getUser().getId().equals(userId))
        .map(TravelMember::getTravelRoom)
        .distinct()
        .map(
            room ->
                (RoomView)
                    new RoomView() { // 익명 구현체를 생성해 반환
                      @Override
                      public Long getRoomId() {
                        return room.getId();
                      }

                      @Override
                      public String getTitle() {
                        return room.getTitle();
                      }

                      @Override
                      public String getRegion() {
                        return room.getRegion().getName();
                      }

                      @Override
                      public java.time.LocalDate getStartDate() {
                        return room.getStartDate();
                      }

                      @Override
                      public java.time.LocalDate getEndDate() {
                        return room.getEndDate();
                      }

                      @Override
                      public java.time.LocalDateTime getCreatedAt() {
                        return room.getCreatedAt();
                      }

                      @Override
                      public List<String> getMembers() {
                        return room.getTravelMembers().stream()
                            .map(m -> m.getUser().getNickname())
                            .toList();
                      }
                    })
        .toList();
  }

  @Override
  public boolean existsUser(Long roomId, Long userId) {
    return travelMemberRepository.existsById(new TravelMemberId(roomId, userId));
  }

  @Override
  public void travelMemeberSave(TravelMember tm) {
    travelMemberRepository.save(tm);
  }

  @Override
  public TravelRoom findById(Long roomId) {
    TravelRoom room =
        travelRoomRepository
            .findById(roomId)
            .orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));
    return room;
  }

  @Override
  public List<User> findUsersByRoomId(Long roomId) {
    List<TravelMember> roomUsers = travelMemberRepository.findById_RoomId(roomId);
    return roomUsers.stream().map(TravelMember::getUser).collect(Collectors.toList());
  }
}
