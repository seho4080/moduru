import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  places: [],
};

const wishPlaceSlice = createSlice({
  name: 'wishPlace',
  initialState,
  reducers: {
    // NOTE: 서버에서 전체 희망 장소 목록을 받아서 상태에 저장
    setWishPlaces(state, action) {
      state.places = action.payload;
    },

    // NOTE: 새 희망 장소를 상태에 추가
    addWishPlace(state, action) {
      state.places.push(action.payload);
    },

    // NOTE: wantId로 특정 희망 장소 제거
    removeWishPlace(state, action) {
      state.places = state.places.filter(
        (place) => place.wantId !== action.payload
      );
    },
  },
});

export const { setWishPlaces, addWishPlace, removeWishPlace } = wishPlaceSlice.actions;
export default wishPlaceSlice.reducer;
