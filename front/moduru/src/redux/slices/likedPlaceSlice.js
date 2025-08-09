import { createSlice } from "@reduxjs/toolkit";

const likedPlaceSlice = createSlice({
  name: "likedPlace",
  initialState: {
    likedPlaceIds: [],
  },
  reducers: {
    // NOTE: 이미 좋아요한 경우 제거, 아니면 추가하는 토글 기능
    toggleLike: (state, action) => {
      const placeId = action.payload;
      const index = state.likedPlaceIds.indexOf(placeId);

      if (index >= 0) {
        state.likedPlaceIds.splice(index, 1);
      } else {
        state.likedPlaceIds.push(placeId);
      }
    },

    // NOTE: 외부에서 받아온 좋아요 목록 전체 갱신
    setLikes: (state, action) => {
      state.likedPlaceIds = action.payload ? [...action.payload] : [];
    },

    // NOTE: 좋아요 목록 초기화
    clearLikes: (state) => {
      state.likedPlaceIds = [];
    },
  },
});

export const { toggleLike, setLikes, clearLikes } = likedPlaceSlice.actions;
export default likedPlaceSlice.reducer;
