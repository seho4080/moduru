// src/redux/slices/itinerarySlice.js
import { createSlice, nanoid } from "@reduxjs/toolkit";

const initialState = {
  // days['YYYY-MM-DD'] = [{ entryId, wantId?, placeId, placeName, category, startTime?, endTime?, eventOrder? }, ...]
  days: {},
};

/** 안전 숫자 변환 */
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

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
      },
      prepare({ date, place, index }) {
        const placeId =
          place.placeId ?? place.id ?? String(place.name ?? place.title ?? "");
        const placeName =
          place.placeName ?? place.name ?? place.title ?? "이름 없음";
        const wantIdNum = toNum(place.wantId ?? place.id);
        return {
          payload: {
            dateKey: date,
            index,
            place: {
              entryId: nanoid(), // 항상 고유 키 생성
              wantId: wantIdNum,
              placeId,
              placeName,
              category: place.category ?? place.type ?? "",
              ...place,
            },
          },
        };
      },
    },

    // 같은 날짜 내 순서 변경 (보정 포함)
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
      const insertAt = fromIdx < target ? target - 1 : target; // 보정
      arr.splice(insertAt, 0, moved);
    },

    // 다른 날짜로 이동: toIdx 위치로 삽입
    moveItemAcross(state, action) {
      const { fromDate, toDate, fromIdx, toIdx } = action.payload;
      if (!fromDate || !toDate) return;
      if (fromDate === toDate) return;

      const fromArr = state.days[fromDate];
      if (!fromArr || fromIdx < 0 || fromIdx >= fromArr.length) return;

      const [moved] = fromArr.splice(fromIdx, 1);
      if (!state.days[toDate]) state.days[toDate] = [];
      const toArr = state.days[toDate];

      let insertAt =
        typeof toIdx === "number" && toIdx >= 0 && toIdx <= toArr.length
          ? toIdx
          : toArr.length;

      toArr.splice(insertAt, 0, moved);
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
    },

    // 삭제
    removeItem(state, action) {
      const { dateKey, entryId } = action.payload;
      const list = state.days[dateKey];
      if (!list) return;
      state.days[dateKey] = list.filter((p) => p.entryId !== entryId);
    },

    // ✅ 서버 일정으로 해당 날짜 전체 교체 (커밋 성공/충돌 동기화)
    replaceDayFromServer(state, action) {
      const { dateKey, events } = action.payload || {};
      if (!dateKey || !Array.isArray(events)) return;

      state.days[dateKey] = events
        .slice()
        .sort((a, b) => (toNum(a.eventOrder) ?? 0) - (toNum(b.eventOrder) ?? 0))
        .map((ev) => {
          const wantIdNum = toNum(ev.wantId);
          return {
            entryId: `${ev.wantId ?? "tmp"}:${
              ev.eventOrder ?? idx
            }:${nanoid()}`, // idx는 map 콜백의 index
            wantId: wantIdNum,
            placeId: ev.wantId ?? ev.placeId ?? String(ev.placeName ?? ""),
            placeName: ev.placeName ?? "이름 없음",
            category: ev.category ?? "",
            startTime: ev.startTime ?? null,
            endTime: ev.endTime ?? null,
            eventOrder: toNum(ev.eventOrder),
          };
        });
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
} = itinerarySlice.actions;

export default itinerarySlice.reducer;
