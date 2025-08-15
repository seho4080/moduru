// src/features/schedule/lib/schedulePublishMiddleware.js
import { publishSchedule } from "../../webSocket/scheduleSocket";
import {
  addPlaceToDay,
  removeItem,
  setTimes,
  moveItemWithin,
  moveItemAcross,
  setOrderForDate,
} from "../../../redux/slices/itinerarySlice";

// 날짜 차이 계산(Y-m-d)
const dateDiffInDays = (startISO, targetISO) => {
  const s = new Date(startISO);
  const t = new Date(targetISO);
  s.setHours(0, 0, 0, 0);
  t.setHours(0, 0, 0, 0);
  return Math.floor((t - s) / 86400000);
};

// dateKey → day(1-based)
const calcDay = (startISO, dateKey) => {
  if (!startISO || !dateKey) return null;
  const d = dateDiffInDays(startISO, dateKey);
  return Number.isFinite(d) ? d + 1 : null;
};

const TRIGGERS = new Set([
  addPlaceToDay.type,
  removeItem.type,
  setTimes.type,
  moveItemWithin.type,
  moveItemAcross.type,
  setOrderForDate.type, // ✅ 순서 변경도 방송
]);

export const schedulePublishMiddleware = (store) => (next) => (action) => {
  // WS 수신액션은 재방송 금지
  if (action?.meta?.fromWs || action?.meta?.skipBroadcast) {
    return next(action);
  }

  const result = next(action);
  if (!TRIGGERS.has(action.type)) return result;

  const state = store.getState();
  const roomId = state.tripRoom?.roomId ?? state.tripRoom?.id ?? null;
  const startDate = state.tripRoom?.startDate ?? null;
  const daysMap = state.itinerary?.days ?? {};

  const changedDates = new Set();
  switch (action.type) {
    case addPlaceToDay.type:
      changedDates.add(action.payload?.dateKey ?? action.payload?.date);
      break;
    case removeItem.type:
    case setTimes.type:
    case moveItemWithin.type:
      changedDates.add(action.payload?.dateKey);
      break;
    case moveItemAcross.type:
      changedDates.add(action.payload?.fromDate);
      changedDates.add(action.payload?.toDate);
      break;
    case setOrderForDate.type:
      changedDates.add(action.payload?.dateKey);
      break;
    default:
      break;
  }

  for (const dateKey of changedDates) {
    if (!dateKey) continue;

    const list = daysMap[dateKey] || [];

    // eventOrder(0-based) 기준으로 정렬해서 내보냄
    const ordered = [...list].sort(
      (a, b) => (a.eventOrder ?? 0) - (b.eventOrder ?? 0)
    );

    const events = ordered
      .map((it, idx) => {
        const wid = Number(it.wantId ?? it.placeId ?? it.id);
        if (!Number.isFinite(wid)) return null; // 서버 식별 불가 제외
        return {
          wantId: wid,
          startTime: it.startTime ?? null, // '' 로 보내고 싶으면 '' 로 바꿔도 OK
          endTime: it.endTime ?? null,
          eventOrder: idx, // ✅ 0-based (스크린샷과 일치)
        };
      })
      .filter(Boolean);

    const day = calcDay(startDate, dateKey);

    console.log("[schedule 발행직전]", {
      roomId,
      day,
      date: dateKey,
      events,
      startDate,
      action: action.type,
    });

    if (!roomId) {
      console.warn("[schedule] roomId 누락으로 발행 생략", { dateKey });
      continue;
    }
    if (day == null) {
      console.warn("[schedule] day 계산 실패로 발행 생략", {
        startDate,
        dateKey,
      });
      continue;
    }

    publishSchedule({ roomId, day, date: dateKey, events });
  }

  return result;
};
