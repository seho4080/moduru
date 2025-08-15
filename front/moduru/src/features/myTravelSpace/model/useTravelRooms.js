import { useEffect, useState, useCallback } from "react";
import api from "../../../lib/axios";

const LS_KEY_PREFIX = "TRAVEL_ROOMS_CACHE_v1_";

/* ===== 목록 API ===== */
export async function fetchTravelRoomsApi({
  endpoint = "/users/travel-rooms",
  filter = "none",
  useToken = false,
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
    isOwner: it.isOwner ?? false,
    canDelete: it.canDelete ?? false,
    // (선택) isOwner: it.isOwner ?? false,  // 권한 표시 쓰려면
  }));
}

/* ===== 탈퇴 API ===== */
export async function leaveTravelRoomApi(
  roomId,
  { leaveBase = "/rooms", useToken = false } = {}
) {
  if (roomId == null) throw new Error("roomId가 필요합니다.");
  const id = Number(roomId);
  if (!Number.isFinite(id)) throw new Error(`roomId가 숫자가 아닙니다: ${roomId}`);
  const url = `${leaveBase}/${encodeURIComponent(id)}/leave`;

  const res = await api.delete(url, {
    withCredentials: true,
    useToken, // ⬅️ 하드코딩 제거
    headers: { Accept: "*/*" },
  });
  return res?.data ?? { ok: true }; // 204 대비
}

/* ===== 삭제 API ===== */
export async function deleteTravelRoomApi(
  roomId,
  { removeBase = "/rooms", useToken = false } = {}
) {
  if (roomId == null) throw new Error("roomId가 필요합니다.");
  const id = Number(roomId);
  if (!Number.isFinite(id)) throw new Error(`roomId가 숫자가 아닙니다: ${roomId}`);

  const url = `${removeBase}/${encodeURIComponent(id)}`; // DELETE /rooms/{roomId}
  const res = await api.delete(url, {
    withCredentials: true,
    useToken,
    headers: { Accept: "*/*" },
  });
  return res?.data ?? { ok: true }; // 204 대비
}

/* ===== 화면용 훅 ===== */
export default function useTravelRooms(options = {}) {
  const ENDPOINT    = options.endpoint   ?? "/users/travel-rooms";
  const LEAVE_BASE  = options.leaveBase  ?? "/rooms";
  const REMOVE_BASE = options.removeBase ?? "/rooms";
  const USE_TOKEN   = options.useToken   ?? false;

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
    }
  }, [ENDPOINT, USE_TOKEN, filter, cacheKey]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  // 필터 바뀔 때 캐시 선반영
  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || "[]");
      if (Array.isArray(cached)) setRooms(cached);
    } catch {}
  }, [cacheKey]);

  // 나가기(탈퇴)
  const leaveRoom = useCallback(
    async (roomId, { optimistic = true } = {}) => {
      if (roomId == null) throw new Error("roomId가 필요합니다.");
      let snapshot;
      if (optimistic) {
        setRooms((curr) => {
          snapshot = curr;
          const next = curr.filter((r) => String(r.id) !== String(roomId));
          try { localStorage.setItem(cacheKey, JSON.stringify(next)); } catch {}
          return next;
        });
      }
      try {
        await leaveTravelRoomApi(roomId, { leaveBase: LEAVE_BASE, useToken: USE_TOKEN });
      } catch (e) {
        if (optimistic && snapshot) {
          setRooms(snapshot);
          try { localStorage.setItem(cacheKey, JSON.stringify(snapshot)); } catch {}
        }
        throw e;
      }
    },
    [LEAVE_BASE, USE_TOKEN, cacheKey]
  );

  // 삭제(방 자체 삭제)
  const removeRoom = useCallback(
    async (roomId, { optimistic = true } = {}) => {
      if (roomId == null) throw new Error("roomId가 필요합니다.");
      let snapshot;
      if (optimistic) {
        setRooms((curr) => {
          snapshot = curr;
          const next = curr.filter((r) => String(r.id) !== String(roomId));
          try { localStorage.setItem(cacheKey, JSON.stringify(next)); } catch {}
          return next;
        });
      }
      try {
        await deleteTravelRoomApi(roomId, { removeBase: REMOVE_BASE, useToken: USE_TOKEN });
      } catch (e) {
        if (optimistic && snapshot) {
          setRooms(snapshot);
          try { localStorage.setItem(cacheKey, JSON.stringify(snapshot)); } catch {}
        }
        throw e;
      }
    },
    [REMOVE_BASE, USE_TOKEN, cacheKey]
  );

  // ✅ 한 번만 반환
  return { rooms, loading, error, reload: fetchRooms, filter, setFilter, leaveRoom, removeRoom };
}
