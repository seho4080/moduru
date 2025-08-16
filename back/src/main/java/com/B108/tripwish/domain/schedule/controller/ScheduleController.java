package com.B108.tripwish.domain.schedule.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.B108.tripwish.domain.auth.service.CustomUserDetails;
import com.B108.tripwish.domain.schedule.dto.request.ScheduleCommitRequestDto;
import com.B108.tripwish.domain.schedule.dto.response.ScheduleConflictResponseDto;
import com.B108.tripwish.domain.schedule.dto.response.ScheduleListResponseDto;
import com.B108.tripwish.domain.schedule.dto.response.SchedulePlaceResponseDto;
import com.B108.tripwish.domain.schedule.service.ScheduleService;
import com.B108.tripwish.global.exception.CustomException;
import com.B108.tripwish.global.exception.ErrorCode;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
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

  @Operation(
      summary = "일정 저장(커밋)",
      description =
          """
                            Redis에 저장된 편집 초안을 RDB에 반영합니다.
                            day별 draftVersion을 검증하며, 불일치 시 409(CONFLICT)와 함께 서버 최신 일정/버전을 반환합니다.
                            저장 성공 시 확정 일정(List<ScheduleListResponseDto>)을 반환합니다.
                            """,
      parameters = {@Parameter(name = "roomId", description = "여행 방 ID", required = true)},
      requestBody =
          @io.swagger.v3.oas.annotations.parameters.RequestBody(
              required = true,
              description = "여행 전체 커밋 요청(각 day별 draftVersion 포함)",
              content =
                  @Content(schema = @Schema(implementation = ScheduleCommitRequestDto.class))),
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "커밋 성공: 확정 일정 반환",
            content =
                @Content(
                    array =
                        @ArraySchema(
                            schema = @Schema(implementation = ScheduleListResponseDto.class)))),
        @ApiResponse(
            responseCode = "409",
            description = "버전 충돌: 서버 최신 일정/버전 반환",
            content =
                @Content(schema = @Schema(implementation = ScheduleConflictResponseDto.class))),
        @ApiResponse(
            responseCode = "400",
            description = "저장할 draft 없음(SCHEDULE_EMPTY_DRAFT)",
            content = @Content),
        @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자", content = @Content),
        @ApiResponse(responseCode = "404", description = "일정 또는 방을 찾을 수 없음", content = @Content),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류", content = @Content)
      })
  @PostMapping("/schedules/commit")
  public ResponseEntity<?> commit(
      @PathVariable Long roomId, @RequestBody ScheduleCommitRequestDto request) {
    try {
      // 정상 커밋 시: 200 OK (원하면 최신 확정 일정 반환)
      scheduleService.commitSchedule(roomId, request);
      List<ScheduleListResponseDto> saved = scheduleService.getSchedules(roomId);
      return ResponseEntity.ok(saved);

    } catch (CustomException e) {
      // 409: 버전 충돌 → 서버 최신 데이터와 버전 함께 내려줌
      if (e.getErrorCode() == ErrorCode.SCHEDULE_VERSION_CONFLICT) {
        ScheduleConflictResponseDto payload = scheduleService.handleVersionConflict(roomId);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(payload);
      }
      // 그 외 에러 매핑
      return ResponseEntity.status(e.getErrorCode().getStatus())
          .body(
              Map.of(
                  "error", e.getErrorCode().name(),
                  "message", e.getMessage()));
    }
  }

  @Operation(
      summary = "여행방 일정 장소 조회",
      description =
          """
                            방 ID를 기준으로 해당 여행방의 일정에 포함된 장소 목록을 조회합니다.
                            중복된 장소는 제거되며, 일정에서 처음 등장한 순서를 기준으로 반환됩니다.
                            """,
      parameters = {@Parameter(name = "roomId", description = "여행 방 ID", required = true)},
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "조회 성공: 장소명/주소 목록 반환",
            content =
                @Content(
                    array =
                        @ArraySchema(
                            schema = @Schema(implementation = SchedulePlaceResponseDto.class)))),
        @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자", content = @Content),
        @ApiResponse(responseCode = "404", description = "해당 방 또는 일정이 존재하지 않음", content = @Content),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류", content = @Content)
      })
  @GetMapping("/schedules/places")
  public ResponseEntity<List<SchedulePlaceResponseDto>> getSchedulePlace(
      @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long roomId) {
    List<SchedulePlaceResponseDto> response = scheduleService.getPlaceListBySchedule(roomId);
    return ResponseEntity.ok(response);
  }
}
