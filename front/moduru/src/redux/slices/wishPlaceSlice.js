// src/redux/slices/wishPlaceSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  places: [], // 각 원소: { placeId, wantId, isWanted, ... }
};

const wishPlaceSlice = createSlice({
  name: "wishPlace",
  initialState,
  reducers: {
    /**
     * 전체 찜 목록을 덮어씀
     */
    setWishPlaces(state, action) {
      state.places = action.payload;
    },

    /**
     * 새로운 찜 장소 추가
     */
    addWishPlace(state, action) {
      const newPlace = action.payload;

      // placeId를 안전하게 꺼냄
      const newPlaceId =
        typeof newPlace.placeId === "object"
          ? newPlace.placeId.placeId
          : newPlace.placeId;

      // 중복 여부 확인
      const alreadyExists = state.places.some((p) => {
        const existingPlaceId =
          typeof p.placeId === "object" ? p.placeId.placeId : p.placeId;
        return Number(existingPlaceId) === Number(newPlaceId);
      });

      if (!alreadyExists) {
        state.places.push({
          ...newPlace,
          placeId: Number(newPlaceId), // 항상 숫자형 placeId로 저장
        });
      }
    },

    /**
     * wantId 기준으로 찜 제거
     */
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
