// redux/slices/aiRouteSlice.js
import { createSlice } from "@reduxjs/toolkit";

/**
 * STATUS payload:
 *  { roomId, status: "STARTED"|"PROGRESS"|"DONE"|"ERROR"|"INVALIDATED",
 *    jobId?, updatedAt?, progress?, message?, reason?, day? }
 *
 * RESULT payload (둘 중 하나 수용):
 *  1) { schedule: [ { day:number, legs:[...] }, ... ] }  또는  schedule: [ [day, legs], ... ]
 *  2) { day:number, legs:[...] }  // 단일 일차 결과
 */

// ── Helpers ──────────────────────────────────────────────────────────────────
export const EMPTY_LEGS = Object.freeze([]);

const clampPercent = (n) => Math.max(0, Math.min(100, Number(n) || 0));

const isNewerOrEqual = (prevISO, nextISO) => {
  if (!nextISO) return true;
  if (!prevISO) return true;
  return new Date(nextISO).getTime() >= new Date(prevISO).getTime();
};

const sortByOrder = (legs = []) =>
  legs
    .slice()
    .sort(
      (a, b) => (Number(a?.eventOrder) || 0) - (Number(b?.eventOrder) || 0)
    );

// 서버 포맷을 [{day, legs}]로 정규화
function toPairs(schedule) {
  if (!Array.isArray(schedule) || schedule.length === 0) return [];
  // [[day, legs], ...]
  if (Array.isArray(schedule[0]) && schedule[0].length >= 2) {
    return schedule
      .filter(
        (x) => Array.isArray(x) && Number.isFinite(x[0]) && Array.isArray(x[1])
      )
      .map(([d, legs]) => ({ day: Number(d), legs }));
  }
  // [{ day, legs }, ...]
  return schedule
    .filter((x) => Number.isFinite(x?.day) && Array.isArray(x?.legs))
    .map((x) => ({ day: Number(x.day), legs: x.legs }));
}

function buildRoutesByDay(pairs) {
  const out = {};
  for (const { day, legs } of pairs) {
    out[day] = sortByOrder(Array.isArray(legs) ? legs : []);
  }
  return out;
}

// ── State ───────────────────────────────────────────────────────────────────
const initialState = {
  status: null, // ← 컴포넌트에서는 selectAiRouteStatus로 "IDLE" 보정해서 사용
  message: "",
  jobId: null,
  updatedAt: null, // ISO string
  progress: 0, // 0~100
  lastRequestedDay: null,
  lastStatusDay: null, // 마지막으로 status 메시지에서 본 day
  routesByDay: {}, // { [day:number]: legs[] }

  // 완료본 백업 (옵션)
  lastCompletedResult: null, // { routesByDay, jobId, updatedAt }
  lastCompletedAt: null,
};

// ── Slice ───────────────────────────────────────────────────────────────────
const aiRouteSlice = createSlice({
  name: "aiRoute",
  initialState,
  reducers: {
    // 사용자가 클릭한 일차 저장
    setLastRequestedDay(state, { payload }) {
      state.lastRequestedDay = Number.isFinite(payload)
        ? Number(payload)
        : null;
    },

    // 🔹 모달 닫기/취소 시: 상태만 초기화 (결과는 남김)
    resetAiRouteTransient(state) {
      state.status = null; // selectAiRouteStatus가 "IDLE"로 보정
      state.message = "";
      state.progress = 0;
      state.lastRequestedDay = null;
      state.lastStatusDay = null;
      // routesByDay / lastCompletedResult는 보존
    },

    // 🔹 전부 지우는 리셋(필요할 때만)
    resetAiRouteAll(state) {
      state.status = null;
      state.message = "";
      state.progress = 0;
      state.lastRequestedDay = null;
      state.lastStatusDay = null;
      state.routesByDay = {};
      state.jobId = null;
      state.updatedAt = null;
      // state.lastCompletedResult = null;
      // state.lastCompletedAt = null;
    },

    // STATUS
    applyRouteStatusStarted(state, { payload }) {
      const { msg } = payload || {};
      const newJob = msg?.jobId && state.jobId && msg.jobId !== state.jobId;
      // STARTED는 새 작업 시작 신호일 수 있으므로, 타임스탬프만 역주행 방지
      if (!newJob && !isNewerOrEqual(state.updatedAt, msg?.updatedAt)) return;

      state.status = "STARTED";
      state.jobId = msg?.jobId ?? state.jobId;
      state.updatedAt = msg?.updatedAt ?? state.updatedAt;
      state.message = "";
      state.progress = 0;

      if (Number.isFinite(msg?.day)) state.lastStatusDay = Number(msg.day);
      if (Number.isFinite(msg?.day)) state.lastRequestedDay = Number(msg.day);

      if (newJob) {
        state.routesByDay = {}; // 다른 작업 시작 시 이전 결과 제거
      }
    },

    applyRouteStatusProgress(state, { payload }) {
      const { msg } = payload || {};
      // 👇 지연된 타 작업 메시지 무시
      if (state.jobId && msg?.jobId && msg.jobId !== state.jobId) return;
      if (!isNewerOrEqual(state.updatedAt, msg?.updatedAt)) return;

      state.status = "PROGRESS";
      state.jobId = msg?.jobId ?? state.jobId;
      state.updatedAt = msg?.updatedAt ?? state.updatedAt;

      if (Number.isFinite(msg?.progress)) {
        state.progress = Math.max(state.progress, clampPercent(msg.progress));
      }
      if (Number.isFinite(msg?.day)) state.lastStatusDay = Number(msg.day);
    },

    applyRouteStatusDone(state, { payload }) {
      const { msg } = payload || {};
      if (state.jobId && msg?.jobId && msg.jobId !== state.jobId) return;
      if (!isNewerOrEqual(state.updatedAt, msg?.updatedAt)) return;

      state.status = "DONE";
      state.jobId = msg?.jobId ?? state.jobId;
      state.updatedAt = msg?.updatedAt ?? state.updatedAt;
      state.progress = 100;
      if (Number.isFinite(msg?.day)) state.lastStatusDay = Number(msg.day);

      // 완료본 백업
      if (Object.keys(state.routesByDay || {}).length > 0) {
        state.lastCompletedResult = {
          routesByDay: { ...state.routesByDay },
          jobId: state.jobId,
          updatedAt: state.updatedAt,
        };
        state.lastCompletedAt = state.updatedAt;
      }
    },

    applyRouteStatusError(state, { payload }) {
      const { msg } = payload || {};
      if (state.jobId && msg?.jobId && msg.jobId !== state.jobId) return;
      if (!isNewerOrEqual(state.updatedAt, msg?.updatedAt)) return;

      state.status = "ERROR";
      state.jobId = msg?.jobId ?? state.jobId;
      state.updatedAt = msg?.updatedAt ?? state.updatedAt;
      state.message = msg?.message || "AI 경로 추천 중 오류가 발생했습니다.";
      if (Number.isFinite(msg?.day)) state.lastStatusDay = Number(msg.day);
    },

    applyRouteStatusInvalidated(state, { payload }) {
      const { msg } = payload || {};
      if (state.jobId && msg?.jobId && msg.jobId !== state.jobId) return;
      if (!isNewerOrEqual(state.updatedAt, msg?.updatedAt)) return;

      state.status = "INVALIDATED";
      state.jobId = msg?.jobId ?? state.jobId;
      state.updatedAt = msg?.updatedAt ?? state.updatedAt;
      state.message =
        msg?.reason || msg?.message || "이전 경로 작업이 무효화되었습니다.";
      if (Number.isFinite(msg?.day)) state.lastStatusDay = Number(msg.day);
    },

    // RESULT
    applyRouteResult(state, { payload }) {
      const { msg } = payload || {};
      if (state.jobId && msg?.jobId && msg.jobId !== state.jobId) return;
      if (!isNewerOrEqual(state.updatedAt, msg?.updatedAt)) return;

      state.jobId = msg?.jobId ?? state.jobId;
      state.updatedAt = msg?.updatedAt ?? state.updatedAt;

      // ① 멀티-데이 포맷(schedule)
      const schedule = Array.isArray(msg?.schedule)
        ? msg.schedule
        : Array.isArray(msg?.result?.schedule)
        ? msg.result.schedule
        : [];

      const pairs = toPairs(schedule);
      if (pairs.length > 0) {
        state.routesByDay = buildRoutesByDay(pairs); // 전체 교체
        state.status = "DONE";
        state.progress = 100;
        state.message = msg?.message || null;

        state.lastCompletedResult = {
          routesByDay: { ...state.routesByDay },
          jobId: state.jobId,
          updatedAt: state.updatedAt,
        };
        state.lastCompletedAt = state.updatedAt;
        return;
      }

      // ② 단일-데이 포맷(day + legs) — ✅ NaN 안전 폴백
      const day = [
        msg?.day,
        msg?.targetDay,
        msg?.meta?.day,
        state.lastRequestedDay,
      ]
        .map((v) => Number(v))
        .find((n) => Number.isFinite(n));

      const legs =
        msg?.legs ??
        msg?.result?.legs ??
        msg?.route?.legs ??
        msg?.data?.legs ??
        [];

      if (Number.isFinite(day)) {
        state.routesByDay = {
          ...(state.routesByDay || {}),
          [Number(day)]: Array.isArray(legs) ? sortByOrder(legs) : [],
        };
        state.lastStatusDay = Number(day);
      }

      state.status = "DONE";
      state.progress = 100;
      state.message = msg?.message || null;

      // 완료본 백업
      if (Object.keys(state.routesByDay || {}).length > 0) {
        state.lastCompletedResult = {
          routesByDay: { ...state.routesByDay },
          jobId: state.jobId,
          updatedAt: state.updatedAt,
        };
        state.lastCompletedAt = state.updatedAt;
      }
    },

    // 선택: 마지막 완료 결과로 복구
    restoreLastCompletedRoute(state) {
      if (state.lastCompletedResult) {
        state.routesByDay = { ...state.lastCompletedResult.routesByDay };
        state.jobId = state.lastCompletedResult.jobId;
        state.updatedAt = state.lastCompletedResult.updatedAt;
        state.status = "DONE";
        state.progress = 100;
        state.message = "";
      }
    },
  },
});

// ── Exports ──────────────────────────────────────────────────────────────────
export const {
  setLastRequestedDay,
  resetAiRouteTransient,
  resetAiRouteAll,
  applyRouteStatusStarted,
  applyRouteStatusProgress,
  applyRouteStatusDone,
  applyRouteStatusError,
  applyRouteStatusInvalidated,
  applyRouteResult,
  restoreLastCompletedRoute,
} = aiRouteSlice.actions;

export default aiRouteSlice.reducer;

// ── Selectors (참조 안정성 보장) ─────────────────────────────────────────────
export const selectAiRouteStatus = (s) => s.aiRoute?.status ?? "IDLE";
export const selectAiRouteProgress = (s) => s.aiRoute?.progress ?? 0;

// 전체 Busy 여부
export const selectAiRouteBusy = (s) =>
  (s.aiRoute?.status === "STARTED" || s.aiRoute?.status === "PROGRESS") ??
  false;

// 특정 일차 Busy 여부(선택적)
export const makeSelectAiRouteBusyForDay = (day) => (s) => {
  const busy =
    s.aiRoute?.status === "STARTED" || s.aiRoute?.status === "PROGRESS";
  const lr = Number(s.aiRoute?.lastRequestedDay);
  const ls = Number(s.aiRoute?.lastStatusDay);
  return busy && (lr === Number(day) || ls === Number(day));
};

// 해당 일차 legs
export const selectRouteByDay = (day) => (s) =>
  s.aiRoute?.routesByDay?.[day] || EMPTY_LEGS;

// 통째로
export const selectAiRoute = (s) => s.aiRoute;
