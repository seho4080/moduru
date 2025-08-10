import { createSlice, nanoid } from '@reduxjs/toolkit';

const initialState = {
  // days['YYYY-MM-DD'] = [{ entryId, placeId, placeName, category, ... }, ...]
  days: {}
};

const itinerarySlice = createSlice({
  name: 'itinerary',
  initialState,
  reducers: {
    // 드롭 추가
    addPlaceToDay: {
      reducer(state, action) {
        const { dateKey, place } = action.payload;
        if (!state.days[dateKey]) state.days[dateKey] = [];
        state.days[dateKey].push(place);
      },
      prepare({ date, place }) {
        const placeId = place.placeId ?? place.id ?? String(place.name ?? place.title ?? '');
        const placeName = place.placeName ?? place.name ?? place.title ?? '이름 없음';
        return {
          payload: {
            dateKey: date,               // 내부에서는 dateKey로 통일
            place: {
              entryId: nanoid(),         // 드롭 인스턴스 고유키
              placeId,                   // ✅ placeId 저장
              placeName,
              category: place.category ?? place.type ?? '',
              ...place,
            }
          }
        };
      }
    },

    // 삭제: ✅ placeId 우선, 같은 날짜(dateKey) 범위에서만 삭제
    removeItem(state, action) {
      const { dateKey, placeId, entryId } = action.payload;
      const list = state.days[dateKey];
      if (!list) return;

      if (placeId != null) {
        state.days[dateKey] = list.filter(p => (p.placeId ?? p.id) !== placeId);
      } else if (entryId != null) {
        state.days[dateKey] = list.filter(p => (p.entryId ?? p.id) !== entryId);
      }
    },

    // 머무는 시간 설정: entryId 우선, 없으면 placeId로 보조
    setStayMinutes(state, action) {
      const { dateKey, minutes, entryId, placeId } = action.payload; // minutes: number | null
      const list = state.days[dateKey];
      if (!list) return;

      let target = null;
      if (entryId != null) target = list.find(p => (p.entryId ?? p.id) === entryId);
      if (!target && placeId != null) target = list.find(p => (p.placeId ?? p.id) === placeId);
      if (target) target.stayMinutes = minutes ?? null;
    },

    moveItem(state, action) {
      const { dateKey, fromIdx, toIdx } = action.payload;
      const arr = state.days[dateKey];
      if (!arr || fromIdx === toIdx) return;
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
    }
  }
});

export const { addPlaceToDay, removeItem, setStayMinutes, moveItem } = itinerarySlice.actions;
export default itinerarySlice.reducer;
