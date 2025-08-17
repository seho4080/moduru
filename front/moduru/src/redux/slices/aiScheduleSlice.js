// 1. Redux Slice: redux/slices/aiScheduleSlice.js
// ============================================================================

import { createSlice } from "@reduxjs/toolkit";

/**
 * STATUS: "STARTED" | "PROGRESS" | "DONE" | "ERROR" | "INVALIDATED"
 * RESULT: { schedule: [{ day, legs: [...] }], days?, jobId?, updatedAt? }
 * ✅ 모달 제거, 영구 저장으로 변경
 */

const initialState = {
  // ✅ 모달 관련 제거
  status: null, // ← 초기값 null로 변경 (아직 아무것도 시작되지 않음)
  message: "",
  jobId: null,
  days: null,
  progress: 0, // 0~100
  updatedAt: null, // ISO string
  groups: {}, // { [day]: legs[] } - ✅ 영구 저장
  hasResult: false,

  // ✅ 추가: 마지막 완료된 추천 저장
  lastCompletedResult: null, // DONE 상태일 때의 전체 결과 백업
  lastCompletedAt: null, // 마지막 완료 시점
};

const clampPercent = (n) => Math.max(0, Math.min(100, Number(n) || 0));
const isNewerOrEqual = (prevISO, nextISO) => {
  if (!nextISO) return true;
  if (!prevISO) return true;
  return new Date(nextISO).getTime() >= new Date(prevISO).getTime();
};

function sortByOrder(legs = []) {
  return legs
    .slice()
    .sort(
      (a, b) => (Number(a?.eventOrder) || 0) - (Number(b?.eventOrder) || 0)
    );
}

function buildGroups(schedule = []) {
  const out = {};
  for (const item of schedule) {
    const dayNum = Number(item?.day);
    if (!Number.isFinite(dayNum)) continue;
    const legs = Array.isArray(item?.legs) ? item.legs : [];
    out[dayNum] = sortByOrder(legs);
  }
  return out;
}

const aiScheduleSlice = createSlice({
  name: "aiSchedule",
  initialState,
  reducers: {
    // ✅ 모달 관련 액션 제거, 상태 초기화만 남김
    clearAiSchedule(state) {
      state.status = null;
      state.message = "";
      state.jobId = null;
      state.days = null;
      state.progress = 0;
      state.updatedAt = null;
      state.groups = {};
      state.hasResult = false;
      // lastCompletedResult는 유지 (이전 결과 보존)
    },

    // ✅ 새로운 추천 시작 시에만 이전 결과 클리어
    startNewRecommendation(state) {
      state.status = "STARTED";
      state.message = "";
      state.jobId = null;
      state.days = null;
      state.progress = 0;
      state.updatedAt = null;
      state.groups = {}; // 진행 중 결과 클리어
      state.hasResult = false;
    },

    // (옵션) 낙관적 STARTED
    applyAiStarted(state, { payload }) {
      const { msg } = payload || {};
      state.status = "STARTED";
      state.jobId = msg?.jobId ?? null;
      if (Number.isFinite(msg?.days)) state.days = Number(msg.days);
      state.progress = 0;
      state.updatedAt = msg?.updatedAt ?? state.updatedAt;
      state.message = "";
      state.hasResult = false;
      // 새 작업 시작 시 진행 중 groups만 클리어
      state.groups = {};
    },

    // STATUS
    applyAiStatusStarted(state, { payload }) {
      const { msg } = payload || {};
      const newJob = msg?.jobId && state.jobId && msg.jobId !== state.jobId;
      if (!newJob && !isNewerOrEqual(state.updatedAt, msg?.updatedAt)) return;

      state.status = "STARTED";
      state.jobId = msg?.jobId ?? state.jobId;
      if (Number.isFinite(msg?.days)) state.days = Number(msg.days);
      state.progress = 0;
      state.updatedAt = msg?.updatedAt ?? state.updatedAt;
      state.message = "";
      state.hasResult = false;
      if (newJob) state.groups = {};
    },

    applyAiStatusProgress(state, { payload }) {
      const { msg } = payload || {};
      const newJob = msg?.jobId && state.jobId && msg.jobId !== state.jobId;
      if (!newJob && !isNewerOrEqual(state.updatedAt, msg?.updatedAt)) return;

      state.status = "PROGRESS";
      state.jobId = msg?.jobId ?? state.jobId;
      if (Number.isFinite(msg?.progress)) {
        state.progress = clampPercent(msg.progress);
      }
      state.updatedAt = msg?.updatedAt ?? state.updatedAt;
      if (newJob) {
        state.groups = {};
        state.message = "";
      }
    },

    applyAiStatusDone(state, { payload }) {
      const { msg } = payload || {};
      const newJob = msg?.jobId && state.jobId && msg.jobId !== state.jobId;
      if (!newJob && !isNewerOrEqual(state.updatedAt, msg?.updatedAt)) return;

      state.status = "DONE";
      state.jobId = msg?.jobId ?? state.jobId;
      state.updatedAt = msg?.updatedAt ?? state.updatedAt;
      state.progress = 100;
      if (newJob) state.groups = {};

      // ✅ DONE 상태일 때 현재 결과를 백업 저장
      if (state.hasResult && Object.keys(state.groups).length > 0) {
        state.lastCompletedResult = {
          groups: { ...state.groups },
          days: state.days,
          jobId: state.jobId,
          status: "DONE",
        };
        state.lastCompletedAt = state.updatedAt;
      }
    },

    applyAiStatusError(state, { payload }) {
      const { msg } = payload || {};
      const newJob = msg?.jobId && state.jobId && msg.jobId !== state.jobId;
      if (!newJob && !isNewerOrEqual(state.updatedAt, msg?.updatedAt)) return;

      state.status = "ERROR";
      state.jobId = msg?.jobId ?? state.jobId;
      state.updatedAt = msg?.updatedAt ?? state.updatedAt;
      state.message = msg?.message || "AI 일정 생성 중 오류가 발생했습니다.";
      if (newJob) state.groups = {};
    },

    applyAiStatusInvalidated(state, { payload }) {
      const { msg } = payload || {};
      const newJob = msg?.jobId && state.jobId && msg.jobId !== state.jobId;
      if (!newJob && !isNewerOrEqual(state.updatedAt, msg?.updatedAt)) return;

      state.status = "INVALIDATED";
      state.jobId = msg?.jobId ?? state.jobId;
      state.updatedAt = msg?.updatedAt ?? state.updatedAt;
      state.message =
        msg?.reason || msg?.message || "이전 작업이 무효화되었습니다.";
      if (newJob) state.groups = {};
    },

    // RESULT
    applyAiResult(state, { payload }) {
      const { msg } = payload || {};
      const newJob = msg?.jobId && state.jobId && msg.jobId !== state.jobId;
      if (!newJob && !isNewerOrEqual(state.updatedAt, msg?.updatedAt)) return;

      state.jobId = msg?.jobId ?? state.jobId;
      state.updatedAt = msg?.updatedAt ?? state.updatedAt;

      const schedule = Array.isArray(msg?.schedule)
        ? msg.schedule
        : Array.isArray(msg?.result?.schedule)
        ? msg.result.schedule
        : [];

      if (Number.isFinite(msg?.days)) state.days = Number(msg.days);

      state.groups = buildGroups(schedule); // 완전 교체
      state.hasResult = Object.keys(state.groups).length > 0;
      state.status = "DONE";
      state.progress = 100;

      // ✅ 결과 받을 때도 백업 저장
      if (state.hasResult) {
        state.lastCompletedResult = {
          groups: { ...state.groups },
          days: state.days,
          jobId: state.jobId,
          status: "DONE",
        };
        state.lastCompletedAt = state.updatedAt;
      }
    },

    // ✅ 새로운 액션: 이전 완료된 결과 복원
    restoreLastCompletedResult(state) {
      if (state.lastCompletedResult) {
        state.groups = { ...state.lastCompletedResult.groups };
        state.days = state.lastCompletedResult.days;
        state.jobId = state.lastCompletedResult.jobId;
        state.status = "DONE";
        state.hasResult = Object.keys(state.groups).length > 0;
        state.progress = 100;
        state.updatedAt = state.lastCompletedAt;
        state.message = "";
      }
    },
  },
});

export const {
  clearAiSchedule,
  startNewRecommendation,
  applyAiStarted,
  applyAiStatusStarted,
  applyAiStatusProgress,
  applyAiStatusDone,
  applyAiStatusError,
  applyAiStatusInvalidated,
  applyAiResult,
  restoreLastCompletedResult,
} = aiScheduleSlice.actions;

export default aiScheduleSlice.reducer;
