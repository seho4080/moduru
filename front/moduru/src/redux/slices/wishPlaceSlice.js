// src/redux/slices/wishPlaceSlice.js

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  places: [], // 희망 장소 배열: [{ placeId: {...}, wantId, isWanted }]
};

const wishPlaceSlice = createSlice({
  name: 'wishPlace',
  initialState,
  reducers: {
    setWishPlaces(state, action) {
      state.places = action.payload;
    },

    addWishPlace(state, action) {
      const newPlace = action.payload;

      // NOTE: 동일한 placeId.id를 가진 장소가 이미 있으면 추가하지 않음
      const exists = state.places.some(
        (place) => place.placeId.id === newPlace.placeId.id
      );

      if (!exists) {
        state.places.push(newPlace);
      }
    },

    removeWishPlace(state, action) {
      state.places = state.places.filter(
        (place) => place.wantId !== action.payload
      );
    },
  },
});

export const {
  setWishPlaces,
  addWishPlace,
  removeWishPlace,
} = wishPlaceSlice.actions;

export default wishPlaceSlice.reducer;
