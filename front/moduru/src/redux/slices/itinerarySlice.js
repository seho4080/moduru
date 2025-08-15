// src/redux/slices/itinerarySlice.js
import { createSlice, nanoid } from "@reduxjs/toolkit";

const initialState = {
  // days['YYYY-MM-DD'] = [{ entryId, wantId?, placeId, placeName, category, startTime?, endTime?, eventOrder(0-based) }, ...]
  days: {},
};

/** 안전 숫자 변환 */
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** 일자 배열 0-based로 재번호 부여 */
const renumberDay = (arr = []) => {
  arr.forEach((it, idx) => {
    it.eventOrder = idx; // ✅ 0-based
  });
  return arr;
};

/** wantId 배열을 숫자배열로 정규화 */
const normalizeWantOrder = (arr) =>
  (Array.isArray(arr) ? arr : []).map((v) => toNum(v)).filter((v) => v != null);

const itinerarySlice = createSlice({
  name: "itinerary",
  initialState,
  reducers: {
    // 장소 추가: index가 있으면 그 위치에 삽입, 없으면 끝에 추가
    addPlaceToDay: {
      reducer(state, action) {
        const { dateKey, place, index } = action.payload;
        if (!state.days[dateKey]) state.days[dateKey] = [];
        const arr = state.days[dateKey];
        const insertAt =
          typeof index === "number" && index >= 0 && index <= arr.length
            ? index
            : arr.length;
        arr.splice(insertAt, 0, place);
        renumberDay(arr); // ✅ 0-based 재부여
      },
      prepare({ date, place, index }) {
        const placeId =
          place.placeId ?? place.id ?? String(place.name ?? place.title ?? "");
        const placeName =
          place.placeName ?? place.name ?? place.title ?? "이름 없음";
        const wantIdNum = toNum(place.wantId ?? place.id ?? place.placeId);
        return {
          payload: {
            dateKey: date,
            index,
            place: {
              entryId: nanoid(),
              wantId: wantIdNum,
              placeId,
              placeName,
              category: place.category ?? place.type ?? "",
              startTime: place.startTime ?? null,
              endTime: place.endTime ?? null,
              ...place,
            },
          },
        };
      },
    },

    // 같은 날짜 내 순서 변경
    moveItemWithin(state, action) {
      const { dateKey, fromIdx, toIdx } = action.payload;
      const arr = state.days[dateKey];
      if (!arr) return;
      if (fromIdx === toIdx) return;
      if (fromIdx < 0 || fromIdx >= arr.length) return;

      let target = toIdx;
      if (target < 0) target = 0;
      if (target > arr.length - 1) target = arr.length - 1;

      const [moved] = arr.splice(fromIdx, 1);
      const insertAt = fromIdx < target ? target : target; // 0-based라 보정 단순
      arr.splice(insertAt, 0, moved);
      renumberDay(arr); // ✅
    },

    // 다른 날짜로 이동
    moveItemAcross(state, action) {
      const { fromDate, toDate, fromIdx, toIdx } = action.payload;
      if (!fromDate || !toDate) return;
      if (fromDate === toDate) return;

      const fromArr = state.days[fromDate];
      if (!fromArr || fromIdx < 0 || fromIdx >= fromArr.length) return;

      const [moved] = fromArr.splice(fromIdx, 1);
      renumberDay(fromArr); // ✅ from 정리

      if (!state.days[toDate]) state.days[toDate] = [];
      const toArr = state.days[toDate];

      let insertAt =
        typeof toIdx === "number" && toIdx >= 0 && toIdx <= toArr.length
          ? toIdx
          : toArr.length;
      toArr.splice(insertAt, 0, moved);
      renumberDay(toArr); // ✅ to 정리
    },

    // 시간 설정 (wantId 우선 매칭)
    setTimes(state, action) {
      const { dateKey, entryId, wantId, startTime, endTime } = action.payload;
      const list = state.days[dateKey];
      if (!list) return;

      const wantIdNum = toNum(wantId);
      let t = null;

      if (wantIdNum != null) {
        t = list.find((p) => toNum(p.wantId) === wantIdNum);
      } else if (entryId != null) {
        t = list.find((p) => p.entryId === entryId);
      }

      if (!t) return;
      t.startTime = startTime ?? null;
      t.endTime = endTime ?? null;
      // 순서는 유지 (renumber 불필요)
    },

    // 삭제
    removeItem(state, action) {
      const { dateKey, entryId } = action.payload;
      const list = state.days[dateKey];
      if (!list) return;
      state.days[dateKey] = list.filter((p) => p.entryId !== entryId);
      renumberDay(state.days[dateKey]); // ✅
    },

    // 서버 이벤트로 해당 날짜 전체 교체 (eventOrder 0-based)
    replaceDayFromServer(state, action) {
      const { dateKey, events } = action.payload || {};
      if (!dateKey || !Array.isArray(events)) return;

      state.days[dateKey] = events
        .slice()
        .sort((a, b) => (toNum(a.eventOrder) ?? 0) - (toNum(b.eventOrder) ?? 0))
        .map((ev, idx) => {
          const wantIdNum = toNum(ev.wantId ?? ev.id);
          return {
            entryId: `${ev.wantId ?? "ev"}:${ev.eventOrder ?? idx}:${nanoid()}`,
            wantId: wantIdNum,
            placeId:
              ev.wantId ?? ev.placeId ?? ev.id ?? String(ev.placeName ?? ""),
            placeName: ev.placeName ?? "이름 없음",
            category: ev.category ?? "",
            startTime: ev.startTime ?? null,
            endTime: ev.endTime ?? null,
            lat: ev.lat,
            lng: ev.lng,
            imgUrl: ev.placeImg ?? ev.imgUrl,
            eventOrder: toNum(ev.eventOrder) ?? idx, // ✅ 0-based
          };
        });
    },

    // AI/수신 순서 적용 (wantId 배열)
    setOrderForDate(state, action) {
      const { dateKey, wantOrderIds } = action.payload || {};
      const list = state.days[dateKey];
      if (!dateKey || !Array.isArray(list)) return;

      const order = normalizeWantOrder(wantOrderIds);
      const rank = new Map();
      order.forEach((id, i) => rank.set(id, i));

      const decorated = list.map((item, i) => {
        const wid = toNum(item.wantId);
        const r = rank.has(wid) ? rank.get(wid) : Number.POSITIVE_INFINITY;
        return { item, i, r };
      });

      decorated.sort((a, b) => a.r - b.r || a.i - b.i);
      state.days[dateKey] = decorated.map((d) => d.item);
      renumberDay(state.days[dateKey]); // ✅ 0-based
    },
  },
});

export const {
  addPlaceToDay,
  moveItemWithin,
  moveItemAcross,
  setTimes,
  removeItem,
  replaceDayFromServer,
  setOrderForDate,
} = itinerarySlice.actions;

export default itinerarySlice.reducer;
