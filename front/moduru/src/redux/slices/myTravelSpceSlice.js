// 데이터/필터만 관리하는 슬라이스 (훅 사용 금지)
import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import {
  fetchTravelRoomsApi,
  leaveTravelRoomApi,
} from "../../features/myTravelSpace/model/useTravelRooms"; 


const initialState = {
  items: [],
  loading: false,
  error: null,
  q: "",
  status: "all",       // all | ongoing | done
  serverFilter: "none" // none | pre | done
};

/* ===== Thunks ===== */
export const fetchRoomsThunk = createAsyncThunk(
  "myTravelSpce/fetchRooms",
  async ({ filter = "none", useToken = true } = {}, { rejectWithValue }) => {
    try {
      const list = await fetchTravelRoomsApi({ filter, useToken });
      return { list, filter };
    } catch (e) {
      return rejectWithValue(e?.response?.data ?? e?.message);
    }
  }
);

export const leaveRoomThunk = createAsyncThunk(
  "myTravelSpce/leaveRoom",
  async ({ id, useToken = true } = {}, { rejectWithValue }) => {
    try {
      await leaveTravelRoomApi(id, { useToken });
      return id;
    } catch (e) {
      return rejectWithValue(e?.response?.data ?? e?.message);
    }
  }
);

/* ===== Slice ===== */
const slice = createSlice({
  name: "myTravelSpce",
  initialState,
  reducers: {
    setQuery(state, action) { state.q = action.payload ?? ""; },
    setStatusFilter(state, action) { state.status = action.payload ?? "all"; },
    setServerFilter(state, action) { state.serverFilter = action.payload ?? "none"; },

    setRooms(state, action) {
      state.items = Array.isArray(action.payload) ? action.payload : [];
    },
    upsertRoom(state, action) {
      const r = action.payload;
      const key = String(r.travelRoomId ?? r.id);
      const i = state.items.findIndex(x => String(x.travelRoomId ?? x.id) === key);
      if (i >= 0) state.items[i] = { ...state.items[i], ...r };
      else state.items.unshift(r);
    },
    removeRoom(state, action) {
      const id = action.payload;
      state.items = state.items.filter(x => String(x.travelRoomId ?? x.id) !== String(id));
    },
    clearError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoomsThunk.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(fetchRoomsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.list;
        state.serverFilter = action.payload.filter;
      })
      .addCase(fetchRoomsThunk.rejected, (state, action) => {
        state.loading = false; state.error = action.payload ?? action.error;
      })

      .addCase(leaveRoomThunk.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(leaveRoomThunk.fulfilled, (state, action) => {
        state.loading = false;
        const id = action.payload;
        state.items = state.items.filter(x => String(x.travelRoomId ?? x.id) !== String(id));
      })
      .addCase(leaveRoomThunk.rejected, (state, action) => {
        state.loading = false; state.error = action.payload ?? action.error;
      });
  },
});

export const {
  setQuery,
  setStatusFilter,
  setServerFilter,
  setRooms,
  upsertRoom,
  removeRoom,
  clearError,
} = slice.actions;

export default slice.reducer;

/* ===== Selectors ===== */
export const selectRoot     = (s) => s?.myTravelSpce ?? initialState;
export const selectAllRooms = (s) => selectRoot(s).items;
export const selectLoading  = (s) => selectRoot(s).loading;
export const selectError    = (s) => selectRoot(s).error;
export const selectQuery    = (s) => selectRoot(s).q;
export const selectStatus   = (s) => selectRoot(s).status;
export const selectServerFilter = (s) => selectRoot(s).serverFilter;

export const selectRoomById = (id) =>
  createSelector([selectAllRooms], (items) =>
    items.find((r) => String(r.travelRoomId ?? r.id) === String(id))
  );

export const selectFilteredRooms = createSelector(
  [selectAllRooms, selectQuery, selectStatus],
  (items, q, status) => {
    const qn = (q ?? "").trim().toLowerCase();
    const byQ = qn ? items.filter(r => (r.title ?? "").toLowerCase().includes(qn)) : items;
    if (status === "all") return byQ;
    const now = new Date();
    if (status === "ongoing") return byQ.filter(r => !r.endDate || new Date(r.endDate) >= now);
    if (status === "done")     return byQ.filter(r => r.endDate && new Date(r.endDate) < now);
    return byQ;
  }
);

