import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  pins: [],
};

const pinSlice = createSlice({
  name: "map",
  initialState,
  reducers: {
    addPin: (state, action) => {
      const newPin = action.payload;
      const exists = state.pins.some((pin) => pin.wantId === newPin.wantId);
      if (!exists) {
        state.pins.push(newPin);
      }
    },

    removePin: (state, action) => {
      const { wantId } = action.payload;
      state.pins = state.pins.filter((pin) => pin.wantId !== wantId);
    },

    clearPins: (state) => {
      state.pins = [];
    },

    // 새로 추가: 전체 핀 목록을 한 번에 설정
    setPinCoords: (state, action) => {
      state.pins = action.payload;
    },
  },
});

export const { addPin, removePin, clearPins, setPinCoords } = pinSlice.actions;

export default pinSlice.reducer;
