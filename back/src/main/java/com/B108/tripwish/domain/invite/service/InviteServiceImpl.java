package com.B108.tripwish.domain.invite.service;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.invite.dto.response.InviteLinkResponseDto;
import com.B108.tripwish.domain.invite.dto.response.JoinRoomResponseDto;
import com.B108.tripwish.domain.invite.entity.InviteToken;
import com.B108.tripwish.domain.invite.respository.InviteTokenRepository;
import com.B108.tripwish.domain.room.entity.TravelMember;
import com.B108.tripwish.domain.room.entity.TravelMemberId;
import com.B108.tripwish.domain.room.entity.TravelMemberRole;
import com.B108.tripwish.domain.room.entity.TravelRoom;
import com.B108.tripwish.domain.room.repository.TravelMemberRepository;
import com.B108.tripwish.domain.room.service.RoomService;
import com.B108.tripwish.global.exception.CustomException;
import com.B108.tripwish.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InviteServiceImpl implements InviteService {

    @Value("${invite.baseUrl}")
    private String inviteBaseUrl;

    private final InviteTokenRepository inviteTokenRepository;
    private final TravelMemberRepository travelMemberRepository;
    private final RoomService roomService;

    @Transactional
    @Override
    public InviteLinkResponseDto createInviteLink(Long roomId) {
        TravelRoom room = roomService.findById(roomId);

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

        InviteToken inviteToken = InviteToken.builder()
                .room(room)
                .token(token)
                .val(expiredAt)
                .build();

        inviteTokenRepository.save(inviteToken);

        InviteLinkResponseDto response = new InviteLinkResponseDto(inviteBaseUrl + token);

        return response;
    }

    @Transactional
    @Override
    public JoinRoomResponseDto joinRoomWithToken(CustomUserDetails user, String token) {
        // 토큰 조회
        InviteToken inviteToken = inviteTokenRepository.findByToken(token)
                .orElseThrow(() -> new CustomException(ErrorCode.INVALID_INVITE_TOKEN));

        // 만료 여부 확인
        if (inviteToken.getVal().isBefore(LocalDateTime.now())) {
            throw new CustomException(ErrorCode.EXPIRED_INVITE_TOKEN);
        }

        // 유저가 이미 방 멤버인지 확인
        Long userId = user.getUser().getId();
        Long roomId = inviteToken.getRoom().getId();

        if (!travelMemberRepository.existsById(new TravelMemberId(userId, roomId))) {
            // 새로 참여자 등록
            TravelMember travelMember = TravelMember.builder()
                    .id(new TravelMemberId(userId, roomId))
                    .travelRoom(inviteToken.getRoom())
                    .user(user.getUser())
                    .role(TravelMemberRole.INVITED) // 또는 기본 권한
                    .build();
            travelMemberRepository.save(travelMember);
        }

        return new JoinRoomResponseDto(roomId);

    }
}
