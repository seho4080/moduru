import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  places: [], // 각 원소: { wantId, placeName, placeImg, category, voteCnt, ... }
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
      const alreadyExists = state.places.some(
        (p) => p.refId === newPlace.refId
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

export const { setWishPlaces, addWishPlace, removeWishPlace } =
  wishPlaceSlice.actions;
export default wishPlaceSlice.reducer;
