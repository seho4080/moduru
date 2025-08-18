// ============================================================================
// 2. Hook: src/features/aiSchedule/model/useAiSchedule.js
// ============================================================================

import { useEffect } from "react";
import { useDispatch } from "react-redux";
// WebSocket 구독은 TripRoomProvider에서 통합 처리
import {
  applyAiStatusStarted,
  applyAiStatusProgress,
  applyAiStatusDone,
  applyAiStatusError,
  applyAiStatusInvalidated,
  applyAiResult,
} from "../../../redux/slices/aiScheduleSlice";

/**
 * 상태/결과 소켓 구독 → Redux 반영
 * ✅ 모달 오픈 제거, 상태만 업데이트
 */
export default function useAiSchedule(roomId) {
  const dispatch = useDispatch();

  // WebSocket 구독은 TripRoomProvider에서 통합 처리
  // 개별 구독은 제거하여 중복 방지
}
