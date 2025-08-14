// src/features/schedule/lib/schedulePublishMiddleware.js
import { publishSchedule } from "../../webSocket/scheduleSocket";
import {
  addPlaceToDay,
  removeItem,
  setTimes,
  moveItemWithin,
  moveItemAcross,
} from "../../../redux/slices/itinerarySlice";

// 날짜 차이 계산(Y-m-d 문자열 기준)
const dateDiffInDays = (startISO, targetISO) => {
  const s = new Date(startISO);
  const t = new Date(targetISO);
  // 자정 기준으로 맞춤(시간대 꼬임 방지)
  s.setHours(0, 0, 0, 0);
  t.setHours(0, 0, 0, 0);
  const ms = t - s;
  return Math.floor(ms / (24 * 60 * 60 * 1000));
};

// 날짜키(dateKey) → day(1-based) 계산
const calcDay = (startISO, dateKey) => {
  if (!startISO || !dateKey) return null;
  const d = dateDiffInDays(startISO, dateKey);
  return Number.isFinite(d) ? d + 1 : null;
};

// 액션 타입 중 퍼블리시 트리거
const TRIGGERS = new Set([
  addPlaceToDay.type,
  removeItem.type,
  setTimes.type,
  moveItemWithin.type,
  moveItemAcross.type,
]);

export const schedulePublishMiddleware = (store) => (next) => (action) => {
  // ✅ WS에서 들어온 액션(meta.fromWs)은 재발행을 스킵 (무한루프 방지)
  if (action?.meta?.fromWs) {
    return next(action);
  }

  const result = next(action);

  if (!TRIGGERS.has(action.type)) return result;

  const state = store.getState();
  const roomId = state.tripRoom?.roomId ?? state.tripRoom?.id ?? null;
  const startDate = state.tripRoom?.startDate ?? null;
  const daysMap = state.itinerary?.days ?? {};

  // 어떤 날짜가 바뀌었는지 추출
  const changedDates = new Set();
  switch (action.type) {
    case addPlaceToDay.type:
      changedDates.add(action.payload?.dateKey ?? action.payload?.date);
      break;
    case removeItem.type:
      changedDates.add(action.payload?.dateKey);
      break;
    case setTimes.type:
      changedDates.add(action.payload?.dateKey);
      break;
    case moveItemWithin.type:
      changedDates.add(action.payload?.dateKey);
      break;
    case moveItemAcross.type:
      changedDates.add(action.payload?.fromDate);
      changedDates.add(action.payload?.toDate);
      break;
    default:
      break;
  }

  // 각 날짜에 대해 events 생성 후 퍼블리시
  for (const dateKey of changedDates) {
    if (!dateKey) continue;

    const list = daysMap[dateKey] || [];

    // 서버가 받는 PK 매핑: wantId가 최우선, 없으면 placeId/id
    // wantId 없는 항목은 제외(서버 식별 불가)
    const events = list
      .map((it, idx) => ({
        wantId: it.wantId ?? it.placeId ?? it.id,
        startTime: it.startTime ?? null,
        endTime: it.endTime ?? null,
        eventOrder: idx, // 서버 요구에 따라 0/1 기반 조정 필요
      }))
      .filter((e) => e.wantId != null);

    const day = calcDay(startDate, dateKey);

    // 퍼블리시 직전 로그(문제 추적 핵심)
    console.log("[schedule 발행직전]", {
      roomId,
      day,
      dateKey,
      events,
      startDate,
      action: action.type,
    });

    // 필수값 가드 — 로그를 남기고 리턴(조용히 사라지지 않게)
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

    // 퍼블리시
    publishSchedule(
      { roomId, day, date: dateKey, events },
      { clientTs: Date.now() }
    );
  }

  return result;
};
