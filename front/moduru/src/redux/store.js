// src/redux/store.js
import { configureStore } from "@reduxjs/toolkit";
import mapReducer from "./slices/mapSlice"; // 핀 목록 관리
import likedPlaceReducer from "../features/likedPlace/model/likedPlaceSlice";
import wishPlaceReducer from "../features/wishPlace/model/wishPlaceSlice";

/**
 * Redux 전역 상태 저장소 설정
 */
const store = configureStore({
  reducer: {
    map: mapReducer,
    likedPlace: likedPlaceReducer,
    wishPlace: wishPlaceReducer,
  },
});

export default store;
