package com.B108.tripwish.domain.invite.service;

import com.B108.tripwish.domain.invite.dto.response.InviteLinkResponseDto;
import com.B108.tripwish.domain.invite.entity.InviteToken;
import com.B108.tripwish.domain.invite.respository.InviteTokenRepository;
import com.B108.tripwish.domain.room.entity.TravelRoom;
import com.B108.tripwish.domain.room.service.RoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InviteServiceImpl implements InviteService {

    @Value("${invite.baseUrl}")
    private String inviteBaseUrl;

    private final InviteTokenRepository inviteTokenRepository;
    private final RoomService roomService;

    @Override
    public InviteLinkResponseDto createInviteLink(Long roomId) {
        TravelRoom room = roomService.findById(roomId);

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
}
