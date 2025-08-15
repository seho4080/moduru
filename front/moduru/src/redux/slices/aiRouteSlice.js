import { createSlice } from "@reduxjs/toolkit";

/**
 * STATUS payload (예):
 * { roomId, status: "STARTED"|"PROGRESS"|"DONE"|"ERROR"|"INVALIDATED", jobId?, updatedAt?, message?, reason? }
 *
 * RESULT payload (예):
 * { roomId, jobId, schedule: [ { day:number, legs:[ {...} ] } ] }
 *  또는 백이 [ [day, legs], ... ] 형태로 줄 가능성도 대비
 */

const initialState = {
  status: "IDLE", // 전체 프로세스 상태(단일 채널)
  message: "",
  jobId: null,
  updatedAt: null,
  lastRequestedDay: null, // 사용자가 클릭한 일차(추적용)
  // 일차별 경로 결과 (렌더/적용용)
  routesByDay: {
    // [day:number]: legs[]
  },
};

function sortByOrder(legs = []) {
  return legs
    .slice()
    .sort((a, b) => (a?.eventOrder ?? 0) - (b?.eventOrder ?? 0));
}

function toPairs(schedule) {
  if (!schedule) return [];
  // 권장: [{day, legs}]
  if (Array.isArray(schedule) && schedule.length > 0) {
    if (schedule[0] && Array.isArray(schedule[0]) && schedule[0].length >= 2) {
      // [[day, legs], ...]
      return schedule
        .filter(
          (x) =>
            Array.isArray(x) && Number.isFinite(x[0]) && Array.isArray(x[1])
        )
        .map(([d, legs]) => ({ day: Number(d), legs }));
    }
    // [{day, legs}, ...]
    return schedule
      .filter((x) => Number.isFinite(x?.day) && Array.isArray(x?.legs))
      .map((x) => ({ day: Number(x.day), legs: x.legs }));
  }
  return [];
}

const aiRouteSlice = createSlice({
  name: "aiRoute",
  initialState,
  reducers: {
    setLastRequestedDay(state, { payload }) {
      state.lastRequestedDay = Number.isFinite(payload)
        ? Number(payload)
        : null;
    },

    // STATUS
    applyRouteStatusStarted(state, { payload }) {
      const { msg } = payload || {};
      state.status = "STARTED";
      state.jobId = msg?.jobId ?? state.jobId;
      state.updatedAt = msg?.updatedAt ?? state.updatedAt;
      state.message = "";
    },
    applyRouteStatusProgress(state, { payload }) {
      const { msg } = payload || {};
      state.status = "PROGRESS";
      state.jobId = msg?.jobId ?? state.jobId;
      state.updatedAt = msg?.updatedAt ?? state.updatedAt;
    },
    applyRouteStatusDone(state, { payload }) {
      const { msg } = payload || {};
      state.status = "DONE";
      state.jobId = msg?.jobId ?? state.jobId;
      state.updatedAt = msg?.updatedAt ?? state.updatedAt;
    },
    applyRouteStatusError(state, { payload }) {
      const { msg } = payload || {};
      state.status = "ERROR";
      state.jobId = msg?.jobId ?? state.jobId;
      state.updatedAt = msg?.updatedAt ?? state.updatedAt;
      state.message = msg?.message || "AI 경로 추천 중 오류가 발생했습니다.";
    },
    applyRouteStatusInvalidated(state, { payload }) {
      const { msg } = payload || {};
      state.status = "INVALIDATED";
      state.jobId = msg?.jobId ?? state.jobId;
      state.updatedAt = msg?.updatedAt ?? state.updatedAt;
      state.message = msg?.reason || "이전 경로 작업이 무효화되었습니다.";
    },

    // RESULT
    applyRouteResult(state, { payload }) {
      const { msg } = payload || {};
      state.jobId = msg?.jobId ?? state.jobId;
      state.updatedAt = msg?.updatedAt ?? state.updatedAt;

      const schedule = Array.isArray(msg?.schedule)
        ? msg.schedule
        : Array.isArray(msg?.result?.schedule)
        ? msg.result.schedule
        : [];

      const pairs = toPairs(schedule);
      pairs.forEach(({ day, legs }) => {
        state.routesByDay[day] = sortByOrder(Array.isArray(legs) ? legs : []);
      });

      // Done 보장
      if (state.status !== "DONE") state.status = "DONE";
    },
  },
});

export const {
  setLastRequestedDay,
  applyRouteStatusStarted,
  applyRouteStatusProgress,
  applyRouteStatusDone,
  applyRouteStatusError,
  applyRouteStatusInvalidated,
  applyRouteResult,
} = aiRouteSlice.actions;

export default aiRouteSlice.reducer;
