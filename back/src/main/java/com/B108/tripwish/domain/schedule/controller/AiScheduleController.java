package com.B108.tripwish.domain.schedule.controller;

import java.util.Map;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.schedule.dto.request.AiScheduleRequestDto;
import com.B108.tripwish.domain.schedule.dto.response.AiSnapshotResponseDto;
import com.B108.tripwish.domain.schedule.service.AiScheduleService;
import com.B108.tripwish.global.lock.RoomLockService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/rooms/{roomId}/ai-schedule")
@RequiredArgsConstructor
public class AiScheduleController {

  private final AiScheduleService aiScheduleService;
  private final RoomLockService roomLockService;

  @Operation(
      summary = "AI 일정 추천 요청",
      description =
          """
        지정한 방에 대해 AI 기반의 일정 추천을 요청합니다.
        - 최소 3개 이상의 장소와 1일 이상의 여행일수를 포함해야 합니다.
        - 요청이 접수되면 비동기로 일정 계산을 시작하며, `jobId`가 반환됩니다.
        - 진행 중인 추천이 이미 있다면 409(CONFLICT) 오류가 반환됩니다.
        """,
      requestBody =
          @io.swagger.v3.oas.annotations.parameters.RequestBody(
              description = "AI 일정 추천 요청 DTO",
              required = true,
              content =
                  @Content(
                      mediaType = "application/json",
                      schema = @Schema(implementation = AiScheduleRequestDto.class))),
      responses = {
        @ApiResponse(
            responseCode = "202",
            description = "일정 추천 요청 수락 (비동기 처리)",
            content =
                @Content(
                    mediaType = "application/json",
                    examples =
                        @ExampleObject(
                            value =
                                """
                        {
                          "jobId": "a1b2c3d4-e5f6-7890-1234-56789abcdef0"
                        }
                        """))),
        @ApiResponse(
            responseCode = "409",
            description = "이미 해당 방에서 일정 추천이 진행 중임",
            content =
                @Content(
                    mediaType = "application/json",
                    examples =
                        @ExampleObject(
                            value =
                                """
                        {
                          "error": "이미 일정 추천이 진행 중입니다."
                        }
                        """))),
        @ApiResponse(
            responseCode = "400",
            description = "잘못된 요청 형식(여행일수 < 1 또는 장소 수 < 2)",
            content = @Content),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류", content = @Content)
      })
  @PostMapping("")
  public ResponseEntity<?> recommend(
      @AuthenticationPrincipal CustomUserDetails user,
      @PathVariable Long roomId,
      @RequestBody AiScheduleRequestDto req) {
    // 방 락
    if (!roomLockService.acquireScheduleLock(roomId)) {
      return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "이미 일정 추천이 진행 중입니다."));
    }
    String jobId = aiScheduleService.enqueue(roomId, req);
    return ResponseEntity.accepted().body(Map.of("jobId", jobId));
  }

  @Operation(
      summary = "AI 일정 추천 스냅샷 조회",
      description =
          """
        특정 방의 AI 일정 추천 진행 상태 또는 결과를 조회합니다.
        - IDLE: 현재 진행 중인 추천 없음
        - STARTED: 추천 시작됨
        - PROGRESS: 진행률 포함
        - DONE: 완료, 추천 결과 포함
        - ERROR: 오류 발생
        - INVALIDATED: 기존 추천 무효화
        """,
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "스냅샷 조회 성공",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = AiSnapshotResponseDto.class))),
        @ApiResponse(responseCode = "404", description = "해당 방을 찾을 수 없음", content = @Content),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류", content = @Content)
      })
  @GetMapping("/snapshot")
  public ResponseEntity<AiSnapshotResponseDto> getSnapshot(
      @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long roomId) {
    AiSnapshotResponseDto dto = aiScheduleService.getRoomSnapshot(roomId);

    // 스냅샷은 휘발성 → 캐싱 방지(선택)
    return ResponseEntity.ok().cacheControl(CacheControl.noStore().mustRevalidate()).body(dto);
  }
}
