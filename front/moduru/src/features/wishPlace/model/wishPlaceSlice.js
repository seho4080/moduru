// src/features/wishPlace/model/wishPlaceSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  places: [],  // 전체 희망 장소
};

const wishPlaceSlice = createSlice({
  name: 'wishPlace',
  initialState,
  reducers: {
    setWishPlaces(state, action) {
      state.places = action.payload;
    },
    addWishPlace(state, action) {
      state.places.push(action.payload);
    },
    removeWishPlace(state, action) {
      state.places = state.places.filter(p => p.wantId !== action.payload);
    },
  },
});

export const { setWishPlaces, addWishPlace, removeWishPlace } = wishPlaceSlice.actions;
export default wishPlaceSlice.reducer;
