import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  pins: [],
};

const pinSlice = createSlice({
  name: "pin",
  initialState,
  reducers: {
    /**
     * 공유 핀 추가
     * 동일한 wantId가 있으면 중복 추가 방지
     */
    addPin: (state, action) => {
      const newPin = action.payload;
      const exists = state.pins.some((pin) => pin.wantId === newPin.wantId);
      if (!exists) {
        state.pins.push(newPin);
      }
    },

    /**
     * 공유 핀 제거
     */
    removePin: (state, action) => {
      const { wantId } = action.payload;
      state.pins = state.pins.filter((pin) => pin.wantId !== wantId);
    },

    /**
     * 모든 공유 핀 초기화
     */
    clearPins: (state) => {
      state.pins = [];
    },

    /**
     * 외부에서 핀 목록 전체 설정
     */
    setPinCoords: (state, action) => {
      state.pins = action.payload;
    },
  },
});

export const { addPin, removePin, clearPins, setPinCoords } = pinSlice.actions;
export default pinSlice.reducer;
