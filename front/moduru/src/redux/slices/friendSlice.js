// src/redux/slices/friendSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  list: [], // ✅ friendList
};

const friendSlice = createSlice({
  name: 'friend',
  initialState,
  reducers: {
    setFriendList(state, action) {
      state.list = action.payload;
    },
  },
});

export const { setFriendList } = friendSlice.actions;
export default friendSlice.reducer;
