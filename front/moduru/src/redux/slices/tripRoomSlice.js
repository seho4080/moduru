import { createSlice } from '@reduxjs/toolkit';

const tripRoomSlice = createSlice({
  name: 'tripRoom',
  initialState: {
    roomId: null,
    title: '',
    region: '',
    startDate: '',
    endDate: '',
  },
  reducers: {
    // 부분 병합 업데이트
    setTripRoom(state, action) {
      return { ...state, ...action.payload };
    },
    clearTripRoom() {
      return { roomId: null, title: '', region: '', startDate: '', endDate: '' };
    },
  },
});

export const { setTripRoom, clearTripRoom } = tripRoomSlice.actions;
export default tripRoomSlice.reducer;
