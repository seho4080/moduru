package com.B108.tripwish.domain.invite.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.invite.dto.request.InviteFriendRequestDto;
import com.B108.tripwish.domain.invite.dto.response.FriendInviteInfoResponseDto;
import com.B108.tripwish.domain.invite.dto.response.InvitableFriendListResponseDto;
import com.B108.tripwish.domain.invite.dto.response.InviteLinkResponseDto;
import com.B108.tripwish.domain.invite.dto.response.JoinRoomResponseDto;
import com.B108.tripwish.domain.invite.entity.InviteToken;
import com.B108.tripwish.domain.invite.respository.InviteTokenRepository;
import com.B108.tripwish.domain.room.entity.TravelMember;
import com.B108.tripwish.domain.room.entity.TravelMemberId;
import com.B108.tripwish.domain.room.entity.TravelMemberRole;
import com.B108.tripwish.domain.room.entity.TravelRoom;
import com.B108.tripwish.domain.room.service.RoomReaderService;
import com.B108.tripwish.domain.user.entity.Friend;
import com.B108.tripwish.domain.user.entity.User;
import com.B108.tripwish.domain.user.service.FriendReaderService;
import com.B108.tripwish.domain.user.service.UserReaderService;
import com.B108.tripwish.global.exception.CustomException;
import com.B108.tripwish.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class InviteServiceImpl implements InviteService {

  @Value("${invite.baseUrl}")
  private String inviteBaseUrl;

  private final InviteTokenRepository inviteTokenRepository;
  private final RoomReaderService roomReaderService;
  private final FriendReaderService friendReaderService;
  private final UserReaderService userReaderService;

  @Transactional
  @Override
  public InviteLinkResponseDto createInviteLink(Long roomId) {
    TravelRoom room = roomReaderService.findById(roomId);

    // 이미 초대 토큰이 있는지 확인
    Optional<InviteToken> optionalToken = inviteTokenRepository.findByRoomId(roomId);

    if (optionalToken.isPresent()) {
      InviteToken existingToken = optionalToken.get();
      // 아직 유효한 경우 → 기존 링크 반환
      if (existingToken.getVal().isAfter(LocalDateTime.now())) {
        return new InviteLinkResponseDto(inviteBaseUrl + existingToken.getToken());
      }
      // 만료된 경우 → 삭제
      inviteTokenRepository.delete(existingToken);
    }
    // 새 토큰 생성
    String token = UUID.randomUUID().toString();
    LocalDateTime expiredAt = LocalDateTime.now().plusDays(1); // 24시간 유효

    InviteToken inviteToken = InviteToken.builder().room(room).token(token).val(expiredAt).build();

    inviteTokenRepository.save(inviteToken);

    InviteLinkResponseDto response = new InviteLinkResponseDto(inviteBaseUrl + token);

    return response;
  }

  @Transactional
  @Override
  public JoinRoomResponseDto joinRoomWithToken(CustomUserDetails user, String token) {
    // 토큰 조회
    InviteToken inviteToken =
        inviteTokenRepository
            .findByToken(token)
            .orElseThrow(() -> new CustomException(ErrorCode.INVALID_INVITE_TOKEN));

    // 만료 여부 확인
    if (inviteToken.getVal().isBefore(LocalDateTime.now())) {
      throw new CustomException(ErrorCode.EXPIRED_INVITE_TOKEN);
    }

    // 유저가 이미 방 멤버인지 확인
    Long userId = user.getUser().getId();
    Long roomId = inviteToken.getRoom().getId();

    if (!roomReaderService.existsUser(roomId, userId)) {
      // 새로 참여자 등록
      TravelMember travelMember =
          TravelMember.builder()
              .id(new TravelMemberId(userId, roomId))
              .travelRoom(inviteToken.getRoom())
              .user(user.getUser())
              .role(TravelMemberRole.INVITED) // 또는 기본 권한
              .build();
      roomReaderService.travelMemeberSave(travelMember);
    }

    return new JoinRoomResponseDto(roomId);
  }

  @Override
  public InvitableFriendListResponseDto getFriends(CustomUserDetails user, Long roomId) {

    // 로그인한 사용자의 친구 목록 조회
    List<Friend> friends = friendReaderService.findByUser(user.getUser());

    // 친구들의 방 참여 여부 확인
    List<FriendInviteInfoResponseDto> friendDtos =
        friends.stream()
            .map(
                friend -> {
                  User friendUser = friend.getFriend();
                  Long friendId = friendUser.getId();
                  boolean alreadyInvited = roomReaderService.existsUser(roomId, friendId);

                  return new FriendInviteInfoResponseDto(
                      friendUser.getId(),
                      friendUser.getNickname(),
                      friendUser.getEmail(),
                      alreadyInvited);
                })
            .collect(Collectors.toList());

    return new InvitableFriendListResponseDto(friendDtos);
  }

  @Transactional
  @Override
  public void inviteFriends(InviteFriendRequestDto request) {
    TravelRoom room = roomReaderService.findById(request.getRoomId());

    for (Long friendId : request.getFriendIds()) {

      // 이미 초대되어 있는지 확인
      boolean alreadyExists = roomReaderService.existsUser(request.getRoomId(), friendId);
      if (alreadyExists) continue;

      // 친구 사용자 조회
      User friend = userReaderService.findById(friendId);

      // 새 TravelMember 저장
      TravelMember member = new TravelMember(room, friend, TravelMemberRole.INVITED);
      roomReaderService.travelMemeberSave(member);
    }
  }
}
