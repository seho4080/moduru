// src/features/itinerary/model/useRoomSchedule.js
import { useEffect, useState, useCallback } from "react";
import api from "../../../lib/axios";

const D = (...args) => console.log("[useRoomSchedule]", ...args);

function toYMD(v) {
  if (!v) return null;
  if (typeof v === "string") {
    const m = v.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
  }
  return null;
}
function toHHmm(v) {
  if (!v) return null;
  if (typeof v === "string") {
    const m = v.match(/T?(\d{2}):(\d{2})/);
    if (m) return `${m[1]}:${m[2]}`;
  }
  return null;
}
function stripWrapQuotes(s) {
  if (typeof s !== "string") return s;
  return s.replace(/^"+|"+$/g, "");
}
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

function normalizeRow(item, idx) {
  const dateKey = Object.keys(item || {}).find((k) => /date/i.test(k));
  const dateStr = toYMD(item?.[dateKey]);

  return {
    entryId: item.entryId ?? item.id ?? idx,
    date: dateStr || null,
    placeId: item.placeId ?? item.refId ?? null,
    placeName: item.placeName ?? item.title ?? item.name ?? "",
    address: item.address ?? item.addressName ?? item.roadAddressName ?? "",
    category: item.category ?? item.type ?? null,
    startTime: toHHmm(item.startTime ?? item.beginTime ?? item.startAt),
    endTime: toHHmm(item.endTime ?? item.finishTime ?? item.endAt),
    eventOrder: item.eventOrder ?? item.order ?? idx ?? 0,
    imageUrl: stripWrapQuotes(item.imageUrl ?? item.placeImg ?? null),
    wantId: toNum(item.wantId ?? item.wantID),
    lat: toNum(item.lat),
    lng: toNum(item.lng),
    nextTravelTime: toNum(item.nextTravelTime ?? item.travelTime ?? item.nextMoveTime),
    _raw: item,
  };
}

function groupByDate(rows = []) {
  const out = {};
  rows
    .filter((r) => !!r.date)
    .sort((a, b) => (a.date === b.date ? (a.eventOrder ?? 0) - (b.eventOrder ?? 0) : a.date < b.date ? -1 : 1))
    .forEach((r) => {
      if (!out[r.date]) out[r.date] = [];
      out[r.date].push({ ...r, eventOrder: out[r.date].length });
    });
  return out;
}

export default function useRoomSchedule(roomId, { from, to, includeImages = true } = {}) {
  const [days, setDays] = useState({});
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(!!roomId);
  const [error, setError] = useState(null);
  const [shape, setShape] = useState("unknown"); // 'days-array' | 'days-object' | 'array' | 'object-arraylike' | 'unknown'

  const reload = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    setError(null);
    try {
      D("reload(): start", { roomId, from, to, includeImages, baseURL: api.defaults?.baseURL });
      console.time("[useRoomSchedule] api");

      const res = await api.get(`/rooms/${roomId}/schedules`, {
        withCredentials: true,
        useToken: false,
        headers: { Accept: "*/*" },
      });

      console.timeEnd("[useRoomSchedule] api");
      const payload = res?.data;

      // 새 스펙: [{ day, date, events: [...] }, ...]
      if (Array.isArray(payload) && payload.length && payload.every((d) => d && Array.isArray(d.events))) {
        setShape("days-array");
        const all = [];
        for (const dayObj of payload) {
          const dateStr = toYMD(dayObj.date);
          const evs = Array.isArray(dayObj.events) ? dayObj.events : [];
          evs.forEach((ev, i) => all.push(normalizeRow({ ...ev, date: dateStr }, i)));
        }
        const grouped = groupByDate(all);
        setRows(all);
        setDays(grouped);
        return;
      }

      // 구형: { days: { 'YYYY-MM-DD': [...] } }
      if (payload?.days && !Array.isArray(payload.days) && typeof payload.days === "object") {
        setShape("days-object");
        const normalized = {};
        for (const [date, arr] of Object.entries(payload.days)) {
          const norm = (arr ?? []).map((it, i) => normalizeRow({ ...it, date }, i));
          normalized[date] = groupByDate(norm)[date] ?? [];
        }
        setDays(normalized);
        setRows(Object.values(normalized).flat());
        return;
      }

      // 구형: 플랫 배열
      const arr =
        (Array.isArray(payload) && payload) ||
        (Array.isArray(payload?.data) && payload.data) ||
        (Array.isArray(payload?.items) && payload.items) ||
        (Array.isArray(payload?.list) && payload.list) ||
        (Array.isArray(payload?.content) && payload.content) ||
        null;

      if (arr) {
        setShape(Array.isArray(payload) ? "array" : "object-arraylike");
        const normRows = arr.map((it, i) => normalizeRow(it, i));
        setRows(normRows);
        setDays(groupByDate(normRows));
        return;
      }

      setShape("unknown");
      setRows([]);
      setDays({});
    } catch (e) {
      D("error", {
        message: e?.message,
        status: e?.response?.status,
        data: e?.response?.data,
        url: e?.config?.url,
        params: e?.config?.params,
      });
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [roomId, from, to, includeImages]);

  useEffect(() => {
    if (!roomId) {
      setDays({});
      setRows([]);
      setLoading(false);
      setError(null);
      setShape("unknown");
      return;
    }
    reload();
  }, [roomId, from, to, includeImages, reload]);

  return { days, rows, loading, error, shape, reload };
}
