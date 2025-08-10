package com.B108.tripwish.domain.schedule.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.schedule.dto.response.ScheduleListResponseDto;
import com.B108.tripwish.domain.schedule.service.ScheduleService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/rooms/{roomId}")
public class ScheduleController {

  private final ScheduleService scheduleService;

  @Operation(
      summary = "일정 조회",
      description =
          """
        여행 방에 등록된 전체 일정을 일차(day)별로 조회합니다. 각 일차의 이벤트 목록은 eventOrder 기준으로 오름차순 정렬되어 있습니다.
        각 일정 항목에는 장소명, 대표 이미지, 위도/경도, 시작 시간, 종료 시간, 이동 소요 시간 등이 포함됩니다.
        """,
      responses = {
        @ApiResponse(responseCode = "200", description = "일정 조회 성공"),
        @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자", content = @Content),
        @ApiResponse(responseCode = "404", description = "일정 없음", content = @Content),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류", content = @Content)
      })
  @GetMapping("/schedules")
  public ResponseEntity<List<ScheduleListResponseDto>> getSchedule(
      @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long roomId) {
    List<ScheduleListResponseDto> response = scheduleService.getSchedules(roomId);
    return ResponseEntity.ok(response);
  }
}
