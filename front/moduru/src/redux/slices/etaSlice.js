// src/redux/slices/etaSlice.js
import { createSlice } from "@reduxjs/toolkit";

/** 내부 키: "day:1|driver|123->456" */
const legKey = (day, transport, fromWantId, toWantId) =>
  `day:${day}|${transport}|${fromWantId}->${toWantId}`;

const initialState = {
  byLeg: {
    // [legKey]: { distanceMeters, durationMinutes, polyline?, updatedAt? }
  },
  totals: {
    // "day:1|driver": { totalDistanceMeters, totalDurationMinutes, updatedAt? }
  },
};

const etaSlice = createSlice({
  name: "eta",
  initialState,
  reducers: {
    /** 단일 구간(leg) 저장/업데이트 */
    upsertEta(state, action) {
      const {
        day,
        transport, // "driver" | "transit" | "walking"
        fromWantId,
        toWantId,
        distanceMeters,
        durationMinutes, // ✅ 분 단위
        polyline,
        updatedAt,
      } = action.payload;
      state.byLeg[legKey(day, transport, fromWantId, toWantId)] = {
        distanceMeters,
        durationMinutes,
        polyline,
        updatedAt,
      };
    },

    /** 하루치 일괄 저장 (legs 배열) */
    upsertDayEtas(state, action) {
      const { day, transport, items = [] } = action.payload;
      for (const it of items) {
        const k = legKey(day, transport, it.fromWantId, it.toWantId);
        state.byLeg[k] = {
          distanceMeters: it.distanceMeters,
          durationMinutes: it.durationMinutes, // ✅ 분
          polyline: it.polyline,
          updatedAt: it.updatedAt,
        };
      }
    },

    /** 하루 합계 저장 */
    upsertDayTotals(state, action) {
      const {
        day,
        transport,
        totalDistanceMeters,
        totalDurationMinutes,
        updatedAt,
      } = action.payload;
      const key = `day:${day}|${transport}`;
      state.totals[key] = {
        totalDistanceMeters,
        totalDurationMinutes,
        updatedAt,
      };
    },

    /** 특정 day의 모든 교통수단 결과 제거 */
    clearDay(state, action) {
      const { day } = action.payload;
      Object.keys(state.byLeg).forEach((k) => {
        if (k.startsWith(`day:${day}|`)) delete state.byLeg[k];
      });
      Object.keys(state.totals).forEach((k) => {
        if (k.startsWith(`day:${day}|`)) delete state.totals[k];
      });
    },

    clearAll(state) {
      state.byLeg = {};
      state.totals = {};
    },
  },
});

export const { upsertEta, upsertDayEtas, upsertDayTotals, clearDay, clearAll } =
  etaSlice.actions;

/** 특정 leg 조회 */
export const selectLegEta = (state, { day, transport, fromWantId, toWantId }) =>
  state.eta.byLeg[legKey(day, transport, fromWantId, toWantId)] || null;

/** 하루/교통수단 합계 조회 */
export const selectDayTotals = (state, { day, transport }) =>
  state.eta.totals[`day:${day}|${transport}`] || null;

/** 하루/교통수단의 모든 leg 맵: { "from->to": {...} } */
export const selectDayTransportEtas = (state, { day, transport }) => {
  const res = {};
  const prefix = `day:${day}|${transport}|`;
  for (const [k, v] of Object.entries(state.eta.byLeg)) {
    if (k.startsWith(prefix)) {
      const pair = k.split("|")[2]; // "from->to"
      res[pair] = v;
    }
  }
  return res;
};

export default etaSlice.reducer;
