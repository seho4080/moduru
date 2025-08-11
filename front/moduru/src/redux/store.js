// src/redux/store.js
import { configureStore } from "@reduxjs/toolkit";
import likedPlaceReducer from "./slices/likedPlaceSlice";
import wishPlaceReducer from "./slices/wishPlaceSlice";
import tripMemberReducer from "./slices/tripMemberSlice";
import friendReducer from "./slices/friendSlice";
import tripRoomReducer from "./slices/tripRoomSlice";
import mapReducer from "./slices/mapSlice";
import uiReducer from "./slices/uiSlice";
import sharedPlaceReducer from "./slices/sharedPlaceSlice";
import userReducer from "./slices/userSlice";
import itineraryReducer from "./slices/itinerarySlice";
import { schedulePublishMiddleware } from "../features/travelSchedule/lib/schedulePublishMiddleware";
/**
 * Redux 전역 상태 저장소 설정
 */
const store = configureStore({
  reducer: {
    likedPlace: likedPlaceReducer,
    wishPlace: wishPlaceReducer,
    tripMember: tripMemberReducer,
    friend: friendReducer,
    tripRoom: tripRoomReducer,
    map: mapReducer,
    ui: uiReducer,
    sharedPlace: sharedPlaceReducer,
    user: userReducer,
    itinerary: itineraryReducer,
  },
  middleware: (getDefault) => getDefault().concat(schedulePublishMiddleware),
});

export default store;
