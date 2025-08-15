import { createSlice } from "@reduxjs/toolkit";

// transport 정규화: 소문자 + driver→driving + 기본 transit
const norm = (t) => {
  if (!t) return "transit";
  const s = String(t).toLowerCase();
  return s === "driver" ? "driving" : s;
};

const legKey = (day, transport, fromWantId, toWantId) =>
  `day:${day}|${norm(transport)}|${fromWantId}->${toWantId}`;
const totalsKey = (day, transport) => `day:${day}|${norm(transport)}`;

const initialState = {
  byLeg: {
    // "day:1|driving|123->456": { distanceMeters, durationMinutes, polyline?, updatedAt? }
  },
  totals: {
    // "day:1|transit": { totalDistanceMeters, totalDurationMinutes, updatedAt? }
  },
};

const etaSlice = createSlice({
  name: "eta",
  initialState,
  reducers: {
    upsertEta(state, action) {
      const {
        day,
        transport,
        fromWantId,
        toWantId,
        distanceMeters,
        durationMinutes,
        polyline,
        updatedAt,
      } = action.payload || {};
      if (!day || fromWantId == null || toWantId == null) return;
      state.byLeg[legKey(day, transport, fromWantId, toWantId)] = {
        distanceMeters: Number(distanceMeters ?? 0),
        durationMinutes: Number(durationMinutes ?? 0),
        polyline: polyline ?? null,
        updatedAt,
      };
    },
    upsertDayEtas(state, action) {
      const { day, transport, items = [] } = action.payload || {};
      if (!day) return;
      const t = norm(transport);
      for (const it of items) {
        const k = legKey(day, t, Number(it.fromWantId), Number(it.toWantId));
        state.byLeg[k] = {
          distanceMeters: Number(it.distanceMeters ?? 0),
          durationMinutes: Number(it.durationMinutes ?? 0),
          polyline: it.polyline ?? null,
          updatedAt: it.updatedAt,
        };
      }
    },
    upsertDayTotals(state, action) {
      const {
        day,
        transport,
        totalDistanceMeters,
        totalDurationMinutes,
        updatedAt,
      } = action.payload || {};
      if (!day) return;
      state.totals[totalsKey(day, transport)] = {
        totalDistanceMeters: Number(totalDistanceMeters ?? 0),
        totalDurationMinutes: Number(totalDurationMinutes ?? 0),
        updatedAt,
      };
    },
    clearDay(state, action) {
      const { day } = action.payload || {};
      if (!day) return;
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

// Selectors
export const selectLegEta = (state, { day, transport, fromWantId, toWantId }) =>
  state.eta.byLeg[legKey(day, transport, fromWantId, toWantId)] || null;

export const selectLegEtaByIds = (state, { day, transport, fromId, toId }) =>
  state.eta.byLeg[legKey(day, transport, Number(fromId), Number(toId))] || null;

export const selectDayTotals = (state, { day, transport }) =>
  state.eta.totals[totalsKey(day, transport)] || null;

export const selectDayTransportEtas = (state, { day, transport }) => {
  const res = {};
  const prefix = `day:${day}|${norm(transport)}|`;
  for (const [k, v] of Object.entries(state.eta.byLeg)) {
    if (k.startsWith(prefix)) {
      const pair = k.split("|")[2]; // "from->to"
      res[pair] = v;
    }
  }
  return res;
};

export default etaSlice.reducer;
