import { useEffect, useState, useCallback } from "react";
import api from "../../../lib/axios";

const D = (...args) => console.log("[useRoomSchedule]", ...args);

// YYYY-MM-DD 뽑기(있으면)
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

// 단일 행 정규화(주소/이름만 와도 처리)
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
    _raw: item,
  };
}

// 날짜별 그룹핑(날짜 없으면 빈 객체)
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
  const [days, setDays] = useState({});   // 날짜별 그룹
  const [rows, setRows] = useState([]);   // 원본 행(정규화)
  const [loading, setLoading] = useState(!!roomId);
  const [error, setError] = useState(null);
  const [shape, setShape] = useState("unknown"); // 'array' | 'days-object' | 'object-arraylike' | 'unknown'

  const reload = useCallback(async () => {
    if (!roomId) return;
    setLoading(true); setError(null);
    try {
      D("reload(): start", { roomId, from, to, includeImages, baseURL: api.defaults?.baseURL });
      console.time("[useRoomSchedule] api");

      const res = await api.get(`/rooms/${roomId}/schedules/places`, {
        params: { from, to, includeImages },
        withCredentials: true,
        useToken: false,
        headers: { Accept: "*/*" },
      });

      console.timeEnd("[useRoomSchedule] api");
      const payload = res?.data;
      const topKeys = payload && typeof payload === "object" ? Object.keys(payload) : [];
      D("response", {
        status: res?.status,
        url: res?.config?.baseURL ? `${res.config.baseURL}${res.config.url}` : res?.config?.url,
        params: res?.config?.params,
        dataKeys: topKeys,
      });

      // A) { days: { ... } } 형태
      if (payload?.days && !Array.isArray(payload.days) && typeof payload.days === "object") {
        setShape("days-object");
        const normalized = {};
        for (const [date, arr] of Object.entries(payload.days)) {
          const norm = (arr ?? []).map((it, i) => normalizeRow({ ...it, date }, i));
          normalized[date] = groupByDate(norm)[date] ?? [];
        }
        setDays(normalized);
        setRows(Object.values(normalized).flat());
        D("normalized (days-object) days keys", Object.keys(normalized));
        return;
      }

      // B) 배열 응답 (이번 스펙: [{ placeName, address }])
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
        setDays(groupByDate(normRows)); // 날짜 없으면 {}
        D("normalized (array-like) rows", normRows.length);
        return;
      }

      // C) 미상
      setShape("unknown"); setRows([]); setDays({});
      D("unknown payload shape");
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
      setDays({}); setRows([]); setLoading(false); setError(null); setShape("unknown");
      return;
    }
    reload();
  }, [roomId, from, to, includeImages, reload]);

  return { days, rows, loading, error, shape, reload };
}
