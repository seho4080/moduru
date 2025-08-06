import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userInfo: {
    nickname: "홍길동",
    email: "hong@example.com",
    gender: "남성",
    birthdate: "1990-01-01",
  },
  isLoggedIn: true,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserInfo(state, action) {
      state.userInfo = action.payload;
    },
    setIsLoggedIn(state, action) {
      state.isLoggedIn = action.payload;
    },
  },
});

export const { setUserInfo, setIsLoggedIn } = userSlice.actions;
export default userSlice.reducer;
