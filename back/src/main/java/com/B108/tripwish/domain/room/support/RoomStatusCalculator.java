package com.B108.tripwish.domain.room.support;

import java.time.Clock;
import java.time.LocalDate;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class RoomStatusCalculator {

  // 계산기 전용 상태 타입 (DTO에 의존 X)
  public enum StatusType {
    PRE,
    ONGOING,
    DONE
  }

  private final Clock clock;

  public StatusType calcStatus(LocalDate start, LocalDate end) {
    LocalDate today = LocalDate.now(clock);
    if (start == null || end == null) return StatusType.PRE;
    if (today.isBefore(start)) return StatusType.PRE;
    if (today.isAfter(end)) return StatusType.DONE;
    return StatusType.ONGOING; // 오늘이 [start, end] 범위에 포함
  }

  // 입장 가능 여부(정책 선택)
  // A) 진행 중에만 입장: return s == StatusType.ONGOING;
  // B) 시작 전에도 사전 입장 허용:
  public boolean canEnter(StatusType s) {
    return s == StatusType.PRE || s == StatusType.ONGOING;
  }

  public boolean canReview(StatusType s, boolean userReviewed) {
    return s == StatusType.DONE && !userReviewed;
  }

  public boolean readOnly(StatusType s) {
    return s == StatusType.DONE;
  }

  /** 같은 요청 안에서 "하루 기준" 고정 */
  public LocalDate today() {
    return LocalDate.now(clock);
  }
}
