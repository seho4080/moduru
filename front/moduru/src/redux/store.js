// src/redux/store.js
import { configureStore } from "@reduxjs/toolkit";
import mapReducer from "./slices/mapSlice"; // 핀 목록 관리
import likedPlaceReducer from "./slices/likedPlaceSlice";
import wishPlaceReducer from "./slices/wishPlaceSlice";
import tripMemberReducer from './slices/tripMemberSlice';
import friendReducer from './slices/friendSlice';
import tripRoomReducer from './slices/tripRoomSlice';
/**
 * Redux 전역 상태 저장소 설정
 */
const store = configureStore({
  reducer: {
    map: mapReducer,
    likedPlace: likedPlaceReducer,
    wishPlace: wishPlaceReducer,
    tripMember: tripMemberReducer,
    friend: friendReducer,
    tripRoom: tripRoomReducer,
  },
});

export default store;