import { createSlice } from '@reduxjs/toolkit';

/**
 * 지도 관련 상태를 관리하는 Redux Slice
 * - 핀 목록 관리 (추가, 삭제)
 */
const mapSlice = createSlice({
  name: 'map',

  /** @type {{ pins: { id: string, lat: number, lng: number }[] }} */
  initialState: {
    pins: [],
  },

  reducers: {
    /**
     * 핀 추가
     * @param {Draft<State>} state - 현재 상태
     * @param {PayloadAction<{ id: string, lat: number, lng: number }>} action - 추가할 핀 정보
     */
    addPin: (state, action) => {
      state.pins.push(action.payload);
    },

    /**
     * 핀 삭제
     * @param {Draft<State>} state - 현재 상태
     * @param {PayloadAction<string>} action - 삭제할 핀의 ID
     */
    removePin: (state, action) => {
      state.pins = state.pins.filter((pin) => pin.id !== action.payload);
    },
  },
});

export const { addPin, removePin } = mapSlice.actions;
export default mapSlice.reducer;