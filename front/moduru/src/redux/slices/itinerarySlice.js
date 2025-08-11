import { createSlice, nanoid } from "@reduxjs/toolkit";

/**
 * 상태 구조
 * days: {
 *   "YYYY-MM-DD": [ { entryId, wantId?, placeId?, placeName, startTime?, endTime?, category? ... }, ... ]
 * }
 */
const initialState = { days: {} };

const itinerarySlice = createSlice({
  name: "itinerary",
  initialState,
  reducers: {
    addPlaceToDay: {
      reducer(state, action) {
        const { dateKey, place } = action.payload;
        if (!state.days[dateKey]) state.days[dateKey] = [];
        state.days[dateKey].push(place);
      },
      prepare({ date, place }) {
        const placeId = place.placeId ?? place.id ?? null;
        const placeName =
          place.placeName ?? place.name ?? place.title ?? "이름 없음";
        return {
          payload: {
            dateKey: date,
            place: {
              entryId: nanoid(),
              placeId,
              wantId: place.wantId ?? null,
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

    removeItem(state, action) {
      const { dateKey, entryId } = action.payload;
      const list = state.days[dateKey];
      if (!list) return;
      state.days[dateKey] = list.filter((p) => p.entryId !== entryId);
    },

    setTimes(state, action) {
      const { dateKey, entryId, startTime, endTime } = action.payload;
      const list = state.days[dateKey];
      if (!list) return;
      const item = list.find((p) => p.entryId === entryId);
      if (item) {
        item.startTime = startTime ?? null;
        item.endTime = endTime ?? null;
      }
    },

    moveItemWithin(state, action) {
      const { dateKey, fromIdx, toIdx } = action.payload;
      const arr = state.days[dateKey];
      if (!arr || fromIdx === toIdx) return;
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
    },

    moveItemAcross(state, action) {
      const { fromDate, toDate, fromIdx, toIdx } = action.payload;
      if (!state.days[fromDate]) state.days[fromDate] = [];
      if (!state.days[toDate]) state.days[toDate] = [];

      const fromArr = state.days[fromDate];
      const toArr = state.days[toDate];

      if (!fromArr[fromIdx]) return;
      const [moved] = fromArr.splice(fromIdx, 1);
      const insertAt = Number.isInteger(toIdx) ? toIdx : toArr.length;
      toArr.splice(insertAt, 0, moved);
    },

    setDayList(state, action) {
      const { dateKey, list } = action.payload;
      state.days[dateKey] = Array.isArray(list) ? list : [];
    },
  },
});

export const {
  addPlaceToDay,
  removeItem,
  setTimes,
  moveItemWithin,
  moveItemAcross,
  setDayList,
} = itinerarySlice.actions;

export default itinerarySlice.reducer;
