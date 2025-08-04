// src/shared/model/store.js
import { configureStore } from '@reduxjs/toolkit';
import likedPlaceReducer from '../../features/likedPlace/model/likedPlaceSlice';
import wishPlaceReducer from '../../features/wishPlace/model/wishPlaceSlice';

const store = configureStore({
  reducer: {
    likedPlace: likedPlaceReducer,
    wishPlace: wishPlaceReducer, // ✅ 희망 장소 슬라이스 추가
  },
});

export default store;
