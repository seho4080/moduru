import { useEffect, useState, useCallback, useRef } from "react";
import api from "../../../lib/axios";

const LS_KEY_PREFIX = "TRAVEL_ROOMS_CACHE_v1_";

/* ===== 목록 API ===== */
export async function fetchTravelRoomsApi({
  endpoint = "/users/travel-rooms",
  filter = "none",
  useToken = false, // 쿠키 세션이면 false
} = {}) {
  const res = await api.get(endpoint, {
    withCredentials: true,
    useToken,
    params: { filter },
    headers: { Accept: "*/*" },
  });
  const list = Array.isArray(res?.data) ? res.data : (res?.data?.data ?? []);
  return (list || []).map((it) => ({
    id: it.travelRoomId ?? it.id,
    title: it.title ?? "",
    region: it.region ?? "",
    startDate: it.startDate ?? null,
    endDate: it.endDate ?? null,
    createdAt: it.createdAt ?? null,
    members: Array.isArray(it.members) ? it.members : [],
    status: it.status ?? null,
    canEnter: it.canEnter ?? true,
    canReview: it.canReview ?? false,
  }));
}

/* ===== 탈퇴 API: DELETE 고정 ===== */
export async function leaveTravelRoomApi(
  roomId,
  { leaveBase = "/rooms", useToken = false } = {}
) {
  if (roomId == null) throw new Error("roomId가 필요합니다.");
  const numericId = Number(roomId);
  if (!Number.isFinite(numericId)) {
    throw new Error(`roomId가 숫자가 아닙니다: ${roomId}`);
  }
  const url = `${leaveBase}/${encodeURIComponent(numericId)}/leave`;

  // axios.delete에서 body가 필요하면 config.data에 넣으면 됨.
  const res = await api.delete(url, {
    withCredentials: true,
    useToken: false,
    headers: { Accept: "*/*" },
  });
  return res?.data ?? { ok: true };
}

/* ===== 화면용 훅 ===== */
export default function useTravelRooms(options = {}) {
  const ENDPOINT   = options.endpoint  ?? "/users/travel-rooms";
  const LEAVE_BASE = options.leaveBase ?? "/rooms";
  const USE_TOKEN  = options.useToken  ?? false;

  const [filter, setFilter] = useState(options.initialFilter ?? "none");
  const cacheKey = `${LS_KEY_PREFIX}${filter}`;

  const [rooms, setRooms] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || "[]");
      return Array.isArray(cached) ? cached : [];
    } catch { return []; }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const firstLoad = useRef(true);

  const fetchRooms = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const normalized = await fetchTravelRoomsApi({
        endpoint: ENDPOINT,
        filter,
        useToken: USE_TOKEN,
      });
      setRooms(normalized);
      localStorage.setItem(cacheKey, JSON.stringify(normalized));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
      firstLoad.current = false;
    }
  }, [ENDPOINT, USE_TOKEN, filter, cacheKey]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || "[]");
      if (Array.isArray(cached)) setRooms(cached);
    } catch {}
  }, [cacheKey]);

  const leaveRoom = useCallback(
    async (roomId, { optimistic = true } = {}) => {
      if (roomId == null) throw new Error("roomId가 필요합니다.");
      const prev = rooms;

      if (optimistic) {
        const next = rooms.filter((r) => String(r.id) !== String(roomId));
        setRooms(next);
        try { localStorage.setItem(cacheKey, JSON.stringify(next)); } catch {}
      }

      try {
        await leaveTravelRoomApi(roomId, { leaveBase: LEAVE_BASE, useToken: USE_TOKEN });
      } catch (e) {
        if (optimistic) {
          setRooms(prev);
          try { localStorage.setItem(cacheKey, JSON.stringify(prev)); } catch {}
        }
        throw e;
      }
    },
    [LEAVE_BASE, USE_TOKEN, rooms, cacheKey]
  );

  return { rooms, loading, error, reload: fetchRooms, filter, setFilter, leaveRoom };
}
