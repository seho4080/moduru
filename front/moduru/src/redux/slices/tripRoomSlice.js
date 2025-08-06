// src/redux/slices/tripRoomSlice.js
import { createSlice } from '@reduxjs/toolkit';

const tripRoomSlice = createSlice({
  name: 'tripRoom',
  initialState: {
    roomId: null,
    title: '',
    region: '',
    startDate: '',
    endDate: '',
    // 필요한 다른 정보들도 추가 가능
  },
  reducers: {
    setTripRoom(state, action) {
      return { ...state, ...action.payload };
    },
    clearTripRoom(state) {
      return {
        roomId: null,
        title: '',
        region: '',
        startDate: '',
        endDate: '',
      };
    },
  },
});

export const { setTripRoom, clearTripRoom } = tripRoomSlice.actions;
export default tripRoomSlice.reducer;
