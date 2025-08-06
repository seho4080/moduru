// src/redux/store.js
import { configureStore } from "@reduxjs/toolkit";
import pinReducer from "./slices/pinSlice"; // 핀 목록 관리
import likedPlaceReducer from "./slices/likedPlaceSlice";
import wishPlaceReducer from "./slices/wishPlaceSlice";
import mapReducer from "./slices/mapSlice";
/**
 * Redux 전역 상태 저장소 설정
 */
const store = configureStore({
  reducer: {
    pin: pinReducer,
    likedPlace: likedPlaceReducer,
    wishPlace: wishPlaceReducer,
    map: mapReducer,
  },
});

export default store;
