// src/redux/slices/wishPlaceSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  places: [], // [{ placeId: { placeId, ... }, wantId, isWanted }]
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

      const newPlaceId = typeof newPlace.placeId === 'object'
        ? newPlace.placeId.placeId
        : newPlace.placeId;

      const alreadyExists = state.places.some(
        (p) => {
          const existingId = typeof p.placeId === 'object' ? p.placeId.placeId : p.placeId;
          return Number(existingId) === Number(newPlaceId);
        }
      );

      if (!alreadyExists) {
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

export const { setWishPlaces, addWishPlace, removeWishPlace } = wishPlaceSlice.actions;
export default wishPlaceSlice.reducer;
