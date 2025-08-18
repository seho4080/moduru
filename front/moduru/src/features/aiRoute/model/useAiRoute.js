import { useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  requestAiRoute,
  getAiRouteSnapshot,
  isAiRouteBusy,
} from "../lib/aiRouteApi";
import {
  setLastRequestedDay,
  applyRouteStatusStarted,
  applyRouteStatusProgress,
  applyRouteStatusDone,
  applyRouteStatusError,
  applyRouteStatusInvalidated,
  applyRouteResult,
  selectAiRouteStatus, // null → "IDLE" 보정용
} from "../../../redux/slices/aiRouteSlice";

/**
 * AI 경로 추천 훅 (+ 스냅샷 프리플라이트)
 * - 소켓 구독: /ai-route/status, /ai-route/result
 * - runAiRoute: 일반 실행 (중복/상태 가드 + 낙관적 STARTED)
 * - preflightAndMaybeStart: 스냅샷을 보고 '복원/이어받기/신규 시작'
 */
export default function useAiRoute(roomId) {
  const dispatch = useDispatch();
  const aiStatus = useSelector(selectAiRouteStatus); // "IDLE" | "STARTED" | "PROGRESS" | "DONE" | ...
  const inFlight = useRef(new Set()); // key: `${roomId}:${day}`

  // WebSocket 구독은 TripRoomProvider에서 통합 처리
  // 개별 구독은 제거하여 중복 방지

  /** 일반 실행(스냅샷 미참조) */
  const runAiRoute = useCallback(
    async (day, placeList) => {
      if (!roomId) return { ok: false, code: 0, message: "roomId is required" };
      if (!Number.isFinite(day))
        return { ok: false, code: 0, message: "day is required" };

      const key = `${roomId}:${day}`;

      // 훅 로컬 중복 가드
      if (inFlight.current.has(key)) {
        return {
          ok: false,
          code: 409,
          message: "이미 이 일차 작업이 진행 중입니다.",
        };
      }

      // 전역 상태 기반 가드 (다른 일차 진행 중 포함)
      if (isAiRouteBusy(aiStatus)) {
        return {
          ok: false,
          code: 409,
          message: "이미 이 일차 작업이 진행 중입니다.",
        };
      }

      dispatch(setLastRequestedDay(day));

      // 낙관적 STARTED → UI 즉시 반응
      dispatch(
        applyRouteStatusStarted({
          msg: { roomId, day, startedAt: new Date().toISOString() },
        })
      );

      inFlight.current.add(key);
      try {
        const res = await requestAiRoute(roomId, placeList, day);

        // ⬇ 409 → snapshot soft-success(이어받기/복원) 처리
        if (res?.resumed && res?.snapshot) {
          const snap = res.snapshot;
          const st = String(snap.status || "").toUpperCase();

          if (st === "STARTED") {
            dispatch(applyRouteStatusStarted({ msg: snap }));
          } else if (st === "PROGRESS") {
            dispatch(applyRouteStatusProgress({ msg: snap }));
          } else if (st === "DONE") {
            const schedule = Array.isArray(snap?.result?.schedule)
              ? snap.result.schedule
              : [];
            if (schedule.length > 0) {
              dispatch(
                applyRouteResult({
                  msg: {
                    schedule,
                    jobId: snap.jobId,
                    updatedAt: snap.updatedAt,
                  },
                })
              );
            }
            dispatch(applyRouteStatusDone({ msg: snap }));
          } else if (st === "INVALIDATED") {
            dispatch(applyRouteStatusInvalidated({ msg: snap }));
          } else if (st === "ERROR") {
            dispatch(applyRouteStatusError({ msg: snap }));
          }
        }

        return res; // 상태/결과는 소켓 또는 위의 스냅샷 경로로 반영됨
      } catch (e) {
        dispatch(
          applyRouteStatusError({
            msg: { roomId, day, message: e?.message || "request failed" },
          })
        );
        return {
          ok: false,
          code: e?.status ?? -1,
          message: e?.message || "request failed",
        };
      } finally {
        inFlight.current.delete(key);
      }
    },
    [roomId, aiStatus, dispatch]
  );

  /**
   * 스냅샷 확인 후:
   * - 진행중이면 그대로 이어받기 (복구) → 모달에서 로딩 상태 표시
   * - DONE + result 있으면 결과 복원 → 모달에서 바로 결과 표시
   * - 그 외(IDLE/ERROR/INVALIDATED)면 autoStartIfIdle=true일 때 신규 시작
   *
   * @returns {Promise<{ok:boolean, mode:'resumed-running'|'restored-done'|'started-new'|'idle', snapshot?:any, error?:string}>}
   */
  const preflightAndMaybeStart = useCallback(
    async (day, placeList, { autoStartIfIdle = true } = {}) => {
      if (!roomId)
        return { ok: false, mode: "idle", error: "roomId is required" };
      if (!Number.isFinite(day))
        return { ok: false, mode: "idle", error: "day is required" };

      // 스냅샷 조회
      let snap;
      try {
        const r = await getAiRouteSnapshot(roomId);
        snap = r?.data || {};
      } catch {
        // 스냅샷 실패해도 신규 시작은 가능하도록
        snap = null;
      }

      const status = String(snap?.status || "").toUpperCase();

      const push = (type) => {
        const msgBase = { ...snap };
        if (type === "STARTED")
          dispatch(applyRouteStatusStarted({ msg: msgBase }));
        if (type === "PROGRESS")
          dispatch(applyRouteStatusProgress({ msg: msgBase }));
        if (type === "DONE") {
          const schedule = Array.isArray(snap?.result?.schedule)
            ? snap.result.schedule
            : [];
          if (schedule.length > 0) {
            dispatch(
              applyRouteResult({
                msg: { schedule, jobId: snap.jobId, updatedAt: snap.updatedAt },
              })
            );
          }
          dispatch(applyRouteStatusDone({ msg: msgBase }));
        }
        if (type === "INVALIDATED")
          dispatch(applyRouteStatusInvalidated({ msg: msgBase }));
        if (type === "ERROR") dispatch(applyRouteStatusError({ msg: msgBase }));
      };

      // 진행 중이면 이어받기
      if (status === "STARTED" || status === "PROGRESS") {
        push(status);
        return { ok: true, mode: "resumed-running", snapshot: snap };
      }

      // 완료 + 결과가 있으면 즉시 복원
      if (status === "DONE" && snap?.result?.schedule?.length) {
        push("DONE");
        return { ok: true, mode: "restored-done", snapshot: snap };
      }

      // 나머지(IDLE/ERROR/INVALIDATED) → 필요 시 신규 시작
      if (autoStartIfIdle) {
        const started = await runAiRoute(day, placeList);
        if (started?.ok)
          return { ok: true, mode: "started-new", snapshot: snap };
        return {
          ok: false,
          mode: "idle",
          error: started?.message || "start failed",
        };
      }

      return { ok: true, mode: "idle", snapshot: snap };
    },
    [roomId, dispatch, runAiRoute]
  );

  return { runAiRoute, preflightAndMaybeStart };
}
