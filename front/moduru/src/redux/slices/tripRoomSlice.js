// src/redux/slices/tripRoomSlice.js  (파일 경로/이름은 프로젝트에 맞게)

// 기존 import 유지
import { createSlice } from "@reduxjs/toolkit";

/** title에서 'YYYY-MM-DD'까지 남기고 이후는 제거 */
function stripTitleToYmd(s) {
  if (typeof s !== "string") return s;
  const m = s.match(/\d{4}-\d{2}-\d{2}/); // 첫 날짜 패턴
  if (!m) return s;
  return s.slice(0, s.indexOf(m[0]) + m[0].length);
}

const initialState = {
  roomId: null,
  title: "",
  region: "",
  startDate: "",
  endDate: "",
  regionVersion: 0,
};

const tripRoomSlice = createSlice({
  name: "tripRoom",
  initialState,
  reducers: {
    // 부분 병합 업데이트
    setTripRoom(state, action) {
      const payload = { ...action.payload };
      if (Object.prototype.hasOwnProperty.call(payload, "title")) {
        payload.title = stripTitleToYmd(payload.title);
      }
      return { ...state, ...payload };
    },

    clearTripRoom() {
      return { ...initialState };
    },

    // 지역만 변경 + regionVersion 증가
    updateRoomRegion(state, action) {
      state.region = action.payload;
      state.regionVersion += 1;
    },

    // 필요 시 title만 갱신하는 액션
    setTitle(state, action) {
      state.title = stripTitleToYmd(action.payload);
    },

    // regionVersion 강제 증가
    bumpRegionVersion(state) {
      state.regionVersion += 1;
    },

    // 여행 기간만 업데이트
    updateTripRoom(state, action) {
      const { startDate, endDate } = action.payload;
      if (startDate) state.startDate = startDate;
      if (endDate) state.endDate = endDate;
    },
  },
});

export const {
  setTripRoom,
  clearTripRoom,
  updateRoomRegion,
  bumpRegionVersion,
  setTitle,
  updateTripRoom,
} = tripRoomSlice.actions;

export const selectRegionVersion = (state) => state.tripRoom.regionVersion;

export default tripRoomSlice.reducer;

