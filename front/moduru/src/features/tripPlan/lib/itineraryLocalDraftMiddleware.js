// src/features/itinerary/lib/itineraryLocalDraftMiddleware.js
import {
  addPlaceToDay,
  removeItem,
  setTimes,
  moveItemWithin,
  moveItemAcross,
  setOrderForDate,
} from "../../../redux/slices/itinerarySlice";
import { saveItinDraft } from "./itineraryLocalDraft";

// 저장 이벤트(쓰로틀)
const TRIGGERS = new Set([
  addPlaceToDay.type,
  removeItem.type,
  setTimes.type,
  moveItemWithin.type,
  moveItemAcross.type,
  setOrderForDate.type,
]);

const timers = new Map(); // roomId -> timeoutId
const THROTTLE_MS = 300;

export const itineraryLocalDraftMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  if (!TRIGGERS.has(action.type)) return result;

  const state = store.getState();
  const roomId = state.tripRoom?.roomId ?? state.tripRoom?.id ?? null;
  const daysMap = state.itinerary?.days ?? {};
  if (!roomId) return result;

  // 쓰로틀 저장
  const prev = timers.get(roomId);
  if (prev) clearTimeout(prev);
  const t = setTimeout(() => {
    saveItinDraft(roomId, { daysMap });
    timers.delete(roomId);
  }, THROTTLE_MS);
  timers.set(roomId, t);

  return result;
};
