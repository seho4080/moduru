import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  roomId: null,
  title: "",
  region: "", // 현재 지역 (문자열 또는 객체)
  startDate: "",
  endDate: "",
  regionVersion: 0, // 지역 변경 트리거용 버전 값 추가
};

const tripRoomSlice = createSlice({
  name: "tripRoom",
  initialState,
  reducers: {
    // 부분 병합 업데이트
    setTripRoom(state, action) {
      return { ...state, ...action.payload };
    },

    clearTripRoom() {
      return { ...initialState };
    },

    // 지역만 변경 + regionVersion 증가
    updateRoomRegion(state, action) {
      state.region = action.payload; // payload 예: '서울' 또는 { id, name, lat, lng }
      state.regionVersion += 1; // 의존하는 훅들 재호출
    },

    // regionVersion 강제 증가 (필요할 때)
    bumpRegionVersion(state) {
      state.regionVersion += 1;
    },
  },
});

export const {
  setTripRoom,
  clearTripRoom,
  updateRoomRegion,
  bumpRegionVersion,
} = tripRoomSlice.actions;

export const selectRegionVersion = (state) => state.tripRoom.regionVersion;

export default tripRoomSlice.reducer;
