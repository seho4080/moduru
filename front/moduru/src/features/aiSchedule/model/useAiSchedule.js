// ============================================================================
// 2. Hook: src/features/aiSchedule/model/useAiSchedule.js
// ============================================================================

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { subscribeAiSchedule } from "../lib/aiScheduleSocket";
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

  useEffect(() => {
    if (!roomId) return;

    const off = subscribeAiSchedule(roomId, {
      onStatus: (msg) => {
        console.log("📩 [AI STATUS 수신]", msg); // 수신 로그
        const s = String(msg?.status ?? msg?.type ?? "").toUpperCase();

        if (s === "STARTED") {
          console.log("▶️ [Hook] Dispatching STARTED");
          dispatch(applyAiStatusStarted({ msg }));
        } else if (s === "PROGRESS") {
          console.log("⏳ [Hook] Dispatching PROGRESS");
          dispatch(applyAiStatusProgress({ msg }));
        } else if (s === "DONE") {
          console.log("✅ [Hook] Dispatching DONE");
          dispatch(applyAiStatusDone({ msg }));
        } else if (s === "ERROR") {
          console.log("❌ [Hook] Dispatching ERROR");
          dispatch(applyAiStatusError({ msg }));
        } else if (s === "INVALIDATED") {
          console.log("🚫 [Hook] Dispatching INVALIDATED");
          dispatch(applyAiStatusInvalidated({ msg }));
        } else {
          console.warn("❓ [Hook] Unknown status:", msg);
        }
      },
      onResult: (msg) => {
        console.log("📩 [AI RESULT 수신]", msg); // 수신 로그
        console.log("🎯 [Hook] Dispatching RESULT");
        dispatch(applyAiResult({ msg }));
      },
    });

    console.log("✅ [Hook] Subscription created");

    return () => {
      console.log("🔌 [Hook] Cleaning up subscription");
      off();
    };
  }, [roomId, dispatch]);
}
