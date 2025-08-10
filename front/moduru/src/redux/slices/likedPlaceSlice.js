// src/redux/slices/likedPlaceSlice.js
import { createSlice } from "@reduxjs/toolkit";

const likedPlaceSlice = createSlice({
  name: "likedPlace",
  initialState: {
    likedPlaceIds: [], // placeId 배열
    likedPlacesById: {}, // placeId -> place 객체
  },
  reducers: {
    // place 객체를 그대로 받음 (placeId or id 포함)
    toggleLike: (state, action) => {
      const place = action.payload;
      const id = Number(place?.placeId ?? place?.id);
      if (!Number.isFinite(id)) return;

      const idx = state.likedPlaceIds.indexOf(id);
      if (idx >= 0) {
        // 제거
        state.likedPlaceIds.splice(idx, 1);
        delete state.likedPlacesById[id];
      } else {
        // 추가
        state.likedPlaceIds.push(id);
        state.likedPlacesById[id] = { ...place, placeId: id };
      }
    },

    // 새로고침/앱 진입 시 서버에서 받은 목록으로 동기화
    setLikes: (state, action) => {
      const arr = Array.isArray(action.payload) ? action.payload : [];
      state.likedPlaceIds = [];
      state.likedPlacesById = {};
      for (const p of arr) {
        const id = Number(p?.placeId ?? p?.id);
        if (!Number.isFinite(id)) continue;
        state.likedPlaceIds.push(id);
        state.likedPlacesById[id] = { ...p, placeId: id };
      }
    },

    clearLikes: (state) => {
      state.likedPlaceIds = [];
      state.likedPlacesById = {};
    },
  },
});

export const { toggleLike, setLikes, clearLikes } = likedPlaceSlice.actions;
export default likedPlaceSlice.reducer;

// selectors
export const selectLikedPlaceIds = (s) => s.likedPlace.likedPlaceIds;
export const selectLikedPlaces = (s) =>
  s.likedPlace.likedPlaceIds
    .map((id) => s.likedPlace.likedPlacesById[id])
    .filter(Boolean);
