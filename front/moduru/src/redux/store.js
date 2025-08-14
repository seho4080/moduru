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
import etaReducer from "./slices/etaSlice";
import { schedulePublishMiddleware } from "../features/travelSchedule/lib/schedulePublishMiddleware";
import scheduleDraftReducer from "./slices/scheduleDraftSlice";

// 👇 trip 멤버 API (네임드 export)
import {
  getTripMembers,
  addFriend,
  removeFriend,
} from "../features/members/lib/tripMemberApi";

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
    eta: etaReducer,
    scheduleDraft: scheduleDraftReducer,
  },
  middleware: (getDefault) =>
    getDefault({
      thunk: {
        // ✅ extraArgument 주입: thunk의 3번째 인자로 들어갑니다.
        extraArgument: { getTripMembers, addFriend, removeFriend },
      },
    }).concat(schedulePublishMiddleware),
});

export default store;
