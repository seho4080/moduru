// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import mapReducer from './slices/mapSlice'; // 핀 목록 관리

/**
 * Redux 전역 상태 저장소 설정
 */
const store = configureStore({
  reducer: {
    map: mapReducer,
    // 다른 slice 생기면 여기에 추가
  },
});

export default store;