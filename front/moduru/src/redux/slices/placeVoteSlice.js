// src/redux/slices/placeVoteSlice.js
import { createSlice } from "@reduxjs/toolkit";

/**
 * 상태 구조:
 * byId[wantId] = { count: number, isVoted: boolean, loading?: boolean, error?: string|null }
 */
const initialState = {
  byId: {},
};

const slice = createSlice({
  name: "placeVote",
  initialState,
  reducers: {
    upsertVoteState(state, action) {
      const { wantId, voteCnt, isVoted } = action.payload || {};
      if (!wantId) return;
      const prev = state.byId[wantId] || { count: 0, isVoted: false };
      state.byId[wantId] = {
        ...prev,
        count: Number.isFinite(voteCnt) ? voteCnt : prev.count,
        isVoted: typeof isVoted === "boolean" ? isVoted : prev.isVoted,
        loading: false,
        error: null,
      };
    },
    setVoteLoading(state, action) {
      const { wantId, loading } = action.payload || {};
      if (!wantId) return;
      const prev = state.byId[wantId] || { count: 0, isVoted: false };
      state.byId[wantId] = { ...prev, loading: !!loading, error: null };
    },
    setVoteError(state, action) {
      const { wantId, error } = action.payload || {};
      if (!wantId) return;
      const prev = state.byId[wantId] || { count: 0, isVoted: false };
      state.byId[wantId] = { ...prev, loading: false, error: error || "error" };
    },
  },
});

export const { upsertVoteState, setVoteLoading, setVoteError } = slice.actions;
export default slice.reducer;

/** 셀렉터 */
export const selectVoteByWantId = (state, wantId) =>
  state?.placeVote?.byId?.[wantId] || { count: 0, isVoted: false, loading: false };