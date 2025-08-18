import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // { [day: number]: number }
  versionsByDay: {},
};

const scheduleDraftSlice = createSlice({
  name: "scheduleDraft",
  initialState,
  reducers: {
    /** WebSocket 편집 수신 시 draftVersion 반영 */
    setDraftVersion(state, action) {
      const { day, draftVersion } = action.payload || {};
      const d = Number(day);
      if (Number.isFinite(d) && typeof draftVersion === "number") {
        state.versionsByDay[d] = draftVersion;
      }
    },
    /** 커밋 성공 후 해당 day의 draftVersion 제거 */
    clearDraftVersions(state, action) {
      const days = action.payload || [];
      days.forEach((d) => delete state.versionsByDay[Number(d)]);
    },
    /** 409 충돌 시 서버 최신 버전으로 전체 치환 */
    replaceVersions(state, action) {
      const latest = action.payload || {};
      const out = {};
      Object.entries(latest).forEach(([k, v]) => {
        const d = Number(k);
        if (Number.isFinite(d) && typeof v === "number") out[d] = v;
      });
      state.versionsByDay = out;
    },
  },
});

export const { setDraftVersion, clearDraftVersions, replaceVersions } =
  scheduleDraftSlice.actions;

export default scheduleDraftSlice.reducer;
