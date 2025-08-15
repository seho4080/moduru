// src/features/aiRoute/model/useAiRoute.js
import { useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { subscribeAiRoute } from "../lib/aiRouteSocket";
import { requestAiRoute } from "../lib/aiRouteApi";
import {
  setLastRequestedDay,
  applyRouteStatusStarted,
  applyRouteStatusProgress,
  applyRouteStatusDone,
  applyRouteStatusError,
  applyRouteStatusInvalidated,
  applyRouteResult,
} from "../../../redux/slices/aiRouteSlice";

/**
 * 항상 { ok, code, message, data } 반환
 * 동일 roomId:day 중복 요청 가드 + 전역 상태(STARTED/PROGRESS) 가드
 */
export default function useAiRoute(roomId) {
  const dispatch = useDispatch();
  const aiStatus = useSelector((s) => s.aiRoute?.status); // "IDLE" | "STARTED" | "PROGRESS" | ...
  const inFlight = useRef(new Set()); // key: `${roomId}:${day}`

  // WebSocket 구독 (상태/결과 수신)
  useEffect(() => {
    if (!roomId) return;
    const off = subscribeAiRoute(roomId, {
      onStatus: (msg) => {
        const s = (msg?.status || "").toUpperCase();
        if (s === "STARTED") dispatch(applyRouteStatusStarted({ msg }));
        else if (s === "PROGRESS") dispatch(applyRouteStatusProgress({ msg }));
        else if (s === "DONE") dispatch(applyRouteStatusDone({ msg }));
        else if (s === "ERROR") dispatch(applyRouteStatusError({ msg }));
        else if (s === "INVALIDATED")
          dispatch(applyRouteStatusInvalidated({ msg }));
      },
      onResult: (msg) => {
        dispatch(applyRouteResult({ msg }));
      },
    });
    return () => off();
  }, [roomId, dispatch]);

  const runAiRoute = useCallback(
    async (day, placeList) => {
      if (!roomId) return { ok: false, code: 0, message: "roomId is required" };

      const key = `${roomId}:${day}`;

      // 훅 레벨 중복 가드
      if (inFlight.current.has(key)) {
        return {
          ok: false,
          code: 409,
          message: "이미 이 일차 작업이 진행 중입니다.",
        };
      }

      // 전역 상태 기반 가드
      if (aiStatus === "STARTED" || aiStatus === "PROGRESS") {
        return {
          ok: false,
          code: 409,
          message: "이미 이 일차 작업이 진행 중입니다.",
        };
      }

      dispatch(setLastRequestedDay(day));

      inFlight.current.add(key);
      try {
        // API 호출 (항상 { ok, code, message, data })
        return await requestAiRoute(roomId, placeList, day);
      } finally {
        inFlight.current.delete(key);
      }
    },
    [roomId, aiStatus, dispatch]
  );

  return { runAiRoute };
}
