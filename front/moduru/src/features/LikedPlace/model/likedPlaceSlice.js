import { createSlice } from '@reduxjs/toolkit';

const likedPlaceSlice = createSlice({
  name: 'likedPlace',
  initialState: {
    likedPlaceIds: [],
  },
  reducers: {
    toggleLike: (state, action) => {
      const placeId = action.payload;
      const index = state.likedPlaceIds.indexOf(placeId);
      if (index >= 0) {
        state.likedPlaceIds.splice(index, 1);
      } else {
        state.likedPlaceIds.push(placeId);
      }
    },
    setLikes: (state, action) => {
      state.likedPlaceIds = action.payload;
    },
  },
});

export const { toggleLike, setLikes } = likedPlaceSlice.actions;
export default likedPlaceSlice.reducer;