package com.B108.tripwish.domain.route.controller;

import java.util.Map;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.route.dto.request.AiRouteRequestDto;
import com.B108.tripwish.domain.route.dto.response.AiRouteSnapshotResponseDto;
import com.B108.tripwish.domain.route.service.AiRouteService;
import com.B108.tripwish.global.lock.RoomLockService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/rooms/{roomId}/ai-route")
@RequiredArgsConstructor
public class AiRouteController {

  private final AiRouteService aiRouteService;
  private final RoomLockService roomLockService;

  @PostMapping("")
  public ResponseEntity<?> recommend(
      @AuthenticationPrincipal CustomUserDetails user,
      @PathVariable Long roomId,
      @RequestBody AiRouteRequestDto req) {
    // 방 락
    if (!roomLockService.acquireRouteLock(roomId, req.getDay())) {
      return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "이미 일정 추천이 진행 중입니다."));
    }
    String jobId = aiRouteService.enqueue(roomId, req);
    return ResponseEntity.accepted().body(Map.of("jobId", jobId));
  }

  @GetMapping("/snapshot")
  public ResponseEntity<AiRouteSnapshotResponseDto> getSnapshot(
      @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long roomId) {
    AiRouteSnapshotResponseDto dto = aiRouteService.getRouteSnapshot(roomId);

    // 스냅샷은 휘발성 → 캐싱 방지(선택)
    return ResponseEntity.ok().cacheControl(CacheControl.noStore().mustRevalidate()).body(dto);
  }
}
