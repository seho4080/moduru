// src/redux/slices/friendSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  list: [], // friendList
};

const friendSlice = createSlice({
  name: "friend",
  initialState,
  reducers: {
    setFriendList(state, action) {
      state.list = action.payload ?? []; // null/undefined 방어
    },
    clearFriendList(state) {
      state.list = []; // 초기화 시에도 빈 배열 고정
    },
  },
});

export const { setFriendList, clearFriendList } = friendSlice.actions;
export default friendSlice.reducer;
