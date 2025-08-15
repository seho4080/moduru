import { createSlice } from "@reduxjs/toolkit";

/**
 * STATUS 토픽(payload 예시):
 * {
 *   roomId, jobId, updatedAt, status: "STARTED"|"PROGRESS"|"DONE"|"ERROR"|"INVALIDATED",
 *   progress?, days?, message?, reason?
 * }
 *
 * RESULT 토픽(payload):
 * { roomId, jobId, schedule: [ { day:number, legs: [ { wantId, placeImg, placeName, transport, eventOrder, lat, lng, nextTravelTime } ] }, ... ] }
 */

const initialState = {
  isOpen: false,
  status: "IDLE", // IDLE | STARTED | PROGRESS | DONE | ERROR | INVALIDATED
  message: "",
  jobId: null,
  days: null,
  progress: 0, // 0~100
  updatedAt: null, // ISO string
  groups: {}, // { [day:number]: legs[] } (eventOrder 오름차순 정렬)
  hasResult: false,
};

function sortByOrder(legs = []) {
  return legs
    .slice()
    .sort((a, b) => (a?.eventOrder ?? 0) - (b?.eventOrder ?? 0));
}

function replaceGroups(state, schedule = []) {
  schedule.forEach(({ day, legs }) => {
    if (!Number.isFinite(day)) return;
    state.groups[Number(day)] = sortByOrder(Array.isArray(legs) ? legs : []);
  });
}

const aiScheduleSlice = createSlice({
  name: "aiSchedule",
  initialState,
  reducers: {
    openAiModal(state) {
      state.isOpen = true;
    },
    closeAiModal(state) {
      state.isOpen = false;
      state.status = "IDLE";
      state.message = "";
      state.jobId = null;
      state.days = null;
      state.progress = 0;
      state.updatedAt = null;
      state.groups = {};
      state.hasResult = false;
    },

    /** 버튼 눌렀을 때 낙관적 STARTED로 열어둘 때 사용 (옵션) */
    applyAiStarted(state, { payload }) {
      const { msg } = payload || {};
      state.status = "STARTED";
      state.jobId = msg?.jobId ?? null;
      if (Number.isFinite(msg?.days)) state.days = Number(msg.days);
      state.progress = 0;
      state.updatedAt = msg?.updatedAt ?? null;
      state.message = "";
      state.hasResult = false;
    },

    // STATUS 분기
    applyAiStatusStarted(state, { payload }) {
      const { msg } = payload || {};
      state.status = "STARTED";
      state.jobId = msg?.jobId ?? state.jobId;
      if (Number.isFinite(msg?.days)) state.days = Number(msg.days);
      state.progress = 0;
      state.updatedAt = msg?.updatedAt ?? state.updatedAt;
      state.message = "";
      state.hasResult = false;
    },

    applyAiStatusProgress(state, { payload }) {
      const { msg } = payload || {};
      state.status = "PROGRESS";
      state.jobId = msg?.jobId ?? state.jobId;
      if (Number.isFinite(msg?.progress)) state.progress = Number(msg.progress);
      state.updatedAt = msg?.updatedAt ?? state.updatedAt;
    },

    applyAiStatusDone(state, { payload }) {
      const { msg } = payload || {};
      state.status = "DONE";
      state.jobId = msg?.jobId ?? state.jobId;
      state.updatedAt = msg?.updatedAt ?? state.updatedAt;
      // 결과는 result에서 반영
    },

    applyAiStatusError(state, { payload }) {
      const { msg } = payload || {};
      state.status = "ERROR";
      state.jobId = msg?.jobId ?? state.jobId;
      state.updatedAt = msg?.updatedAt ?? state.updatedAt;
      state.message = msg?.message || "AI 일정 생성 중 오류가 발생했습니다.";
    },

    applyAiStatusInvalidated(state, { payload }) {
      const { msg } = payload || {};
      state.status = "INVALIDATED";
      state.jobId = msg?.jobId ?? state.jobId;
      state.updatedAt = msg?.updatedAt ?? state.updatedAt;
      state.message = msg?.reason || "이전 작업이 무효화되었습니다.";
    },

    // RESULT
    applyAiResult(state, { payload }) {
      const { msg } = payload || {};
      state.jobId = msg?.jobId ?? state.jobId;
      state.updatedAt = msg?.updatedAt ?? state.updatedAt;
      const schedule = Array.isArray(msg?.schedule)
        ? msg.schedule
        : Array.isArray(msg?.result?.schedule)
        ? msg.result.schedule
        : [];
      state.hasResult = schedule.length > 0;
      replaceGroups(state, schedule);
      if (state.status !== "DONE") state.status = "DONE";
    },
  },
});

export const {
  openAiModal,
  closeAiModal,
  applyAiStarted,
  applyAiStatusStarted,
  applyAiStatusProgress,
  applyAiStatusDone,
  applyAiStatusError,
  applyAiStatusInvalidated,
  applyAiResult,
} = aiScheduleSlice.actions;

export default aiScheduleSlice.reducer;
