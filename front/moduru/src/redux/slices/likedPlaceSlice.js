import { createSlice } from '@reduxjs/toolkit';

const likedPlaceSlice = createSlice({
  name: 'likedPlace',
  initialState: {
    likedPlaceIds: [],
  },
  reducers: {
    // NOTE: 이미 좋아요한 경우는 제거, 아니면 추가하는 토글 기능
    toggleLike: (state, action) => {
      const placeId = action.payload;
      const index = state.likedPlaceIds.indexOf(placeId);

      if (index >= 0) {
        state.likedPlaceIds.splice(index, 1);
      } else {
        state.likedPlaceIds.push(placeId);
      }
    },

    // NOTE: 외부에서 받아온 좋아요 목록 전체를 갱신
    setLikes: (state, action) => {
      state.likedPlaceIds = action.payload;
    },
  },
});

export const { toggleLike, setLikes } = likedPlaceSlice.actions;
export default likedPlaceSlice.reducer;
