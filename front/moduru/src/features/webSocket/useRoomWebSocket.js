// src/features/webSocket/useRoomWebSocket.js
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";

// 공유 장소 관련
import {
  addSharedPlace,
  removeSharedPlace,
  updateVoteState,
} from "../../redux/slices/sharedPlaceSlice";

// AI 경로 추천 관련
import {
  applyRouteStatusStarted,
  applyRouteStatusProgress,
  applyRouteStatusDone,
  applyRouteStatusError,
  applyRouteStatusInvalidated,
  applyRouteResult,
} from "../../redux/slices/aiRouteSlice";

// AI 일정 추천 관련
import {
  applyAiStatusStarted,
  applyAiStatusProgress,
  applyAiStatusDone,
  applyAiStatusError,
  applyAiStatusInvalidated,
  applyAiResult,
} from "../../redux/slices/aiScheduleSlice";

// 이동 시간 계산 관련
import {
  upsertDayEtas,
  upsertDayTotals,
} from "../../redux/slices/etaSlice";

// 일정 관련
import {
  replaceDayFromServer,
} from "../../redux/slices/itinerarySlice";
import {
  setDraftVersion,
} from "../../redux/slices/scheduleDraftSlice";

// 웹소켓 연결 관리
import { connectWebSocket, unsubscribeKeys } from "./coreSocket";

/**
 * 방 입장 시 모든 웹소켓 구독을 한 번에 처리하는 통합 훅
 * - 중복 구독 방지
 * - 방 퇴장 시 자동 정리
 */
export default function useRoomWebSocket(roomId) {
  const dispatch = useDispatch();
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!roomId) {
      console.warn("[useRoomWebSocket] roomId 없음, 구독 생략");
      return;
    }

    // 중복 구독 방지
    if (subscribedRef.current) {
      console.log("[useRoomWebSocket] 이미 구독 중, 중복 방지");
      return;
    }

    console.log("[useRoomWebSocket] 방 입장 시 모든 웹소켓 구독 시작, roomId:", roomId);
    subscribedRef.current = true;

    // 모든 구독을 한 번에 설정
    connectWebSocket(roomId, [
      // 1. 공유 장소 추가/삭제
      {
        handler: "place-want",
        action: "add",
        callback: (message) => {
          console.log("[WebSocket] 공유 장소 추가:", message);
          dispatch(addSharedPlace(message));
        },
        key: "shared-place/add",
      },
      {
        handler: "place-want",
        action: "remove",
        callback: (message) => {
          const key = message?.wantId ?? message?.id ?? message?.placeId;
          if (key == null) return;
          console.log("[WebSocket] 공유 장소 삭제:", key);
          dispatch(removeSharedPlace(Number(key)));
        },
        key: "shared-place/remove",
      },

      // 2. 투표 상태 업데이트
      {
        handler: "place-vote",
        callback: (msg) => {
          const wantId = msg.wantId ?? msg.wantPlaceId;
          const { voteCnt } = msg;
          if (wantId == null) return;
          console.log("[WebSocket] 투표 상태 업데이트:", { wantId, voteCnt });
          dispatch(updateVoteState({ wantId, voteCnt }));
        },
        key: "place-vote",
      },

      // 3. AI 경로 추천 상태/결과
      {
        handler: "ai-route",
        action: "status",
        callback: (msg) => {
          console.log("[WebSocket] AI 경로 상태:", msg);
          const raw = String(msg?.status ?? msg?.type ?? msg?.phase ?? "").toUpperCase();
          if (raw === "STARTED") {
            dispatch(applyRouteStatusStarted({ msg }));
          } else if (raw === "PROGRESS" || typeof msg?.progress === "number") {
            dispatch(applyRouteStatusProgress({ msg }));
          } else if (raw === "DONE") {
            dispatch(applyRouteStatusDone({ msg }));
          } else if (raw === "ERROR") {
            dispatch(applyRouteStatusError({ msg }));
          } else if (raw === "INVALIDATED") {
            dispatch(applyRouteStatusInvalidated({ msg }));
          }
        },
        key: "ai-route/status",
      },
      {
        handler: "ai-route",
        action: "result",
        callback: (msg) => {
          console.log("[WebSocket] AI 경로 결과:", msg);
          dispatch(applyRouteResult({ msg }));
          dispatch(applyRouteStatusDone({ msg: { ...msg, status: "DONE" } }));
        },
        key: "ai-route/result",
      },

      // 4. AI 일정 추천 상태/결과
      {
        handler: "ai-schedule",
        action: "status",
        callback: (msg) => {
          console.log("[WebSocket] AI 일정 상태:", msg);
          const s = String(msg?.status ?? msg?.type ?? "").toUpperCase();
          if (s === "STARTED") {
            dispatch(applyAiStatusStarted({ msg }));
          } else if (s === "PROGRESS") {
            dispatch(applyAiStatusProgress({ msg }));
          } else if (s === "DONE") {
            dispatch(applyAiStatusDone({ msg }));
          } else if (s === "ERROR") {
            dispatch(applyAiStatusError({ msg }));
          } else if (s === "INVALIDATED") {
            dispatch(applyAiStatusInvalidated({ msg }));
          }
        },
        key: "ai-schedule/status",
      },
      {
        handler: "ai-schedule",
        action: "result",
        callback: (msg) => {
          console.log("[WebSocket] AI 일정 결과:", msg);
          dispatch(applyAiResult({ msg }));
        },
        key: "ai-schedule/result",
      },

      // 5. 여행 일정 동기화
      {
        handler: "schedule",
        callback: (msg) => {
          console.log("[WebSocket] 일정 동기화:", msg);
          const { day, date, events, draftVersion } = msg || {};

          const dayNum = Number(day);
          const verNum = Number(draftVersion);
          if (Number.isFinite(dayNum) && Number.isFinite(verNum)) {
            dispatch({
              type: setDraftVersion.type,
              payload: { day: dayNum, draftVersion: verNum },
              meta: { fromWs: true },
            });
          }

          if (date && Array.isArray(events)) {
            dispatch({
              type: replaceDayFromServer.type,
              payload: { dateKey: date, events },
              meta: { fromWs: true },
            });
          }
        },
        key: "schedule/sync",
      },

      // 6. 이동 시간 계산 결과
      {
        handler: "travel",
        callback: (msg) => {
          console.log("[WebSocket] 이동 시간 결과:", msg);
          if (!msg) return;

          let {
            day,
            transport,
            totalDistanceMeters,
            totalDurationMinutes,
            legs,
            updatedAt,
            // 후보 키들
            mode,
            transportType,
            requestedTransport,
            fallbackTransport,
          } = msg;

          if (!day) return;
          const dayNum = Number(day);
          if (!Number.isFinite(dayNum)) return;

          const pick = (...vals) =>
            vals.find((v) => typeof v === "string" && v.length > 0) || null;

          let t = pick(
            transport,
            mode,
            transportType,
            fallbackTransport,
            requestedTransport
          ) || "transit";

          t = String(t).toLowerCase();
          if (t === "driver") t = "driving";

          if (Array.isArray(legs) && legs.length > 0) {
            const items = legs.map((l) => ({
              fromWantId: Number(l.fromWantId ?? l.fromId),
              toWantId: Number(l.toWantId ?? l.toId),
              distanceMeters: Number(l.distanceMeters ?? l.distance ?? 0),
              durationMinutes: Number(l.durationMinutes ?? l.duration ?? 0),
              updatedAt: l.updatedAt ?? updatedAt,
            }));
            dispatch(upsertDayEtas({ day: dayNum, transport: t, items }));
          }

          if (
            typeof totalDistanceMeters === "number" &&
            typeof totalDurationMinutes === "number"
          ) {
            dispatch(
              upsertDayTotals({
                day: dayNum,
                transport: t,
                totalDistanceMeters,
                totalDurationMinutes,
                updatedAt,
              })
            );
          }

          // 이동 시간 계산 결과 이벤트 발생 (markResolvedFromResult용)
          window.dispatchEvent(new CustomEvent('travel-result-update', { 
            detail: { ...msg, status: "DONE" } 
          }));

          // 이동 시간 계산 상태 업데이트 이벤트도 발생
          window.dispatchEvent(new CustomEvent('travel-status-update', { 
            detail: { status: "DONE", body: msg } 
          }));
        },
        key: "travel/result",
      },

      // 7. 이동 시간 계산 상태
      {
        handler: "travel-status",
        callback: (msg) => {
          console.log("[WebSocket] 이동 시간 상태:", msg);
          // 이동 시간 계산 상태는 useCalcStatusByDate에서 처리
          // 이벤트를 발생시켜 해당 훅에서 처리하도록 함
          window.dispatchEvent(new CustomEvent('travel-status-update', { 
            detail: msg 
          }));
        },
        key: "travel/status",
      },
    ]);

    // 정리 함수
    return () => {
      console.log("[useRoomWebSocket] 방 퇴장 시 웹소켓 구독 정리, roomId:", roomId);
      subscribedRef.current = false;
      
      // 모든 구독 키 정리
      const allKeys = [
        "shared-place/add",
        "shared-place/remove",
        "place-vote",
        "ai-route/status",
        "ai-route/result",
        "ai-schedule/status",
        "ai-schedule/result",
        "schedule/sync",
        "travel/result",
        "travel/status",
      ];
      
      unsubscribeKeys?.(allKeys);
    };
  }, [roomId, dispatch]);
}
