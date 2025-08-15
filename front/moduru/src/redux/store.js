// src/redux/store.js
import { configureStore } from "@reduxjs/toolkit";

// reducers
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
import scheduleDraftReducer from "./slices/scheduleDraftSlice";
import myTravelSpceReducer from "./slices/myTravelSpceSlice";
import aiScheduleReducer from "./slices/aiScheduleSlice";
import aiRouteReducer from "./slices/aiRouteSlice";

// middlewares
import { schedulePublishMiddleware } from "../features/travelSchedule/lib/schedulePublishMiddleware";
import { itineraryLocalDraftMiddleware } from "@/features/tripPlan/lib/itineraryLocalDraftMiddleware";

// thunk extraArgument용 API
import {
  getTripMembers,
  addFriend,
  removeFriend,
} from "../features/members/lib/tripMemberApi";

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
    myTravelSpce: myTravelSpceReducer,
    aiSchedule: aiScheduleReducer,
    aiRoute: aiRouteReducer,
  },
  middleware: (getDefault) =>
    getDefault({
      thunk: {
        // thunk의 3번째 인자로 주입
        extraArgument: { getTripMembers, addFriend, removeFriend },
      },
    })
      .concat(schedulePublishMiddleware)       // 서버 방송
      .concat(itineraryLocalDraftMiddleware),  // 로컬 자동 저장
});

export default store;