import { publishSchedule } from "../../webSocket/scheduleSocket";
import {
  addPlaceToDay,
  removeItem,
  setTimes,
  moveItemWithin,
  moveItemAcross,
  setOrderForDate,
} from "../../../redux/slices/itinerarySlice";

// ───────────────────────────────────────────────────────────
// 날짜/일차 계산
// ───────────────────────────────────────────────────────────
const dateDiffInDays = (startISO, targetISO) => {
  const s = new Date(startISO);
  const t = new Date(targetISO);
  s.setHours(0, 0, 0, 0);
  t.setHours(0, 0, 0, 0);
  return Math.floor((t - s) / 86400000);
};

const calcDayFromStart = (startISO, dateKey) => {
  if (!startISO || !dateKey) return null;
  const d = dateDiffInDays(startISO, dateKey);
  return Number.isFinite(d) ? d + 1 : null;
};

const calcDayFallbackByKeys = (daysMap, dateKey) => {
  const keys = Object.keys(daysMap || {})
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  const idx = keys.indexOf(String(dateKey));
  return idx >= 0 ? idx + 1 : null;
};

// ───────────────────────────────────────────────────────────
// 발행 디바운스(날짜별) & 중복 방지
// ───────────────────────────────────────────────────────────
const DEBOUNCE_MS = 150;
const pendingTimers = new Map(); // dateKey -> timeoutId

// 직전 페이로드를 저장해서 완전 동일하면 생략 (불필요한 트래픽 감소)
const lastPayloadByDate = new Map(); // dateKey -> JSON string

const TRIGGERS = new Set([
  addPlaceToDay.type,
  removeItem.type,
  setTimes.type,
  moveItemWithin.type,
  moveItemAcross.type,
  setOrderForDate.type,
]);

function buildEvents(state, dateKey) {
  const list = state.itinerary?.days?.[dateKey] || [];
  // eventOrder(0-based) 기준 정렬
  const ordered = [...list].sort(
    (a, b) => (a.eventOrder ?? 0) - (b.eventOrder ?? 0)
  );
  return ordered
    .map((it, idx) => {
      const wid = Number(it.wantId ?? it.placeId ?? it.id);
      if (!Number.isFinite(wid)) return null;
      return {
        wantId: wid,
        startTime: it.startTime ?? null,
        endTime: it.endTime ?? null,
        eventOrder: idx, // ✅ 0-based (서버가 1-based면 여기서 +1로 바꿔줘)
      };
    })
    .filter(Boolean);
}

export const schedulePublishMiddleware = (store) => (next) => (action) => {
  // WS 수신액션/명시적 생략은 재방송 금지
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

    // 디바운스 재설정
    if (pendingTimers.has(dateKey)) clearTimeout(pendingTimers.get(dateKey));
    pendingTimers.set(
      dateKey,
      setTimeout(() => {
        const fresh = store.getState();
        const events = buildEvents(fresh, dateKey);
        if (!events.length) {
          // 비어있으면 굳이 발행하지 않음(원하면 발행으로 바꿔도 됨)
          pendingTimers.delete(dateKey);
          return;
        }

        // day 계산: 우선 startDate 기반, 없으면 days 키 정렬 기반
        const day =
          calcDayFromStart(fresh.tripRoom?.startDate, dateKey) ??
          calcDayFallbackByKeys(fresh.itinerary?.days, dateKey);

        if (!roomId) {
          console.warn("[schedule] roomId 누락으로 발행 생략", { dateKey });
          pendingTimers.delete(dateKey);
          return;
        }
        if (day == null) {
          console.warn("[schedule] day 계산 실패로 발행 생략", {
            startDate,
            dateKey,
          });
          pendingTimers.delete(dateKey);
          return;
        }

        const payload = { roomId, day, date: dateKey, events };
        const payloadKey = JSON.stringify(payload);
        if (lastPayloadByDate.get(dateKey) === payloadKey) {
          // 직전과 동일 → 생략
          pendingTimers.delete(dateKey);
          return;
        }

        // 콘솔 확인용(필요 없으면 삭제 가능)
        console.log("[schedule 발행]", payload);

        publishSchedule(payload);
        lastPayloadByDate.set(dateKey, payloadKey);
        pendingTimers.delete(dateKey);
      }, DEBOUNCE_MS)
    );
  }

  return result;
};
