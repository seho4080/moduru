// src/redux/slices/sharedPlaceSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  /** @type {Array<{
   *  wantId?: number,
   *  placeId?: number,
   *  placeName: string,
   *  imgUrl?: string,     // 최종 정규화된 이미지 경로
   *  category: string,
   *  address?: string,
   *  lat?: number,
   *  lng?: number,
   *  voteCnt: number,
   *  isVoted?: boolean,
   *  senderId?: string,   // ✅ 통일
   *  // 백호환: 일부 코드가 참조할 수 있어 유지
   *  sendId?: string,
   *  _roomId?: number|string
   * }>} */
  sharedPlaces: [],
};

/** placeId가 객체일 경우 내부 placeId, 아니면 그대로 */
const normalizePlaceId = (placeId) =>
  placeId && typeof placeId === "object" ? placeId.placeId : placeId;

/** 이미지 URL 우선순위 결합 */
function coalesceImageUrl(raw = {}) {
  const candidates = [
    raw.imgUrl, // 웹소켓
    raw.placeImg, // DB
  ];
  for (const c of candidates) {
    if (typeof c === "string") {
      const s = c.trim();
      if (s.length > 0) return s;
    }
  }
  return undefined;
}

/** 서버/웹소켓 원본 → 스토어 포맷 정규화 */
function normalize(raw = {}) {
  const wantIdNum =
    raw.wantId != null
      ? Number(raw.wantId)
      : raw.id != null
      ? Number(raw.id)
      : NaN;
  const wantId = Number.isFinite(wantIdNum) ? wantIdNum : undefined;

  const placeIdNum =
    raw.placeId != null ? Number(normalizePlaceId(raw.placeId)) : NaN;
  const placeId = Number.isFinite(placeIdNum) ? placeIdNum : undefined;

  const latNum = raw.lat != null ? Number(raw.lat) : NaN;
  const lngNum = raw.lng != null ? Number(raw.lng) : NaN;

  const voteCntNum =
    raw.voteCnt != null
      ? Number(raw.voteCnt)
      : raw.likeCount != null
      ? Number(raw.likeCount)
      : 0;

  const imgUrl = coalesceImageUrl(raw);

  // ✅ senderId로 통일(+백호환 sendId 채워둠)
  const senderId =
    raw.senderId ?? raw.sendId ?? raw.userId ?? raw.sender ?? undefined;

  return {
    wantId,
    placeId,
    placeName: raw.placeName ?? raw.name ?? "",
    imgUrl,
    category: raw.category ?? raw.type ?? "",
    address: raw.address ?? "",
    lat: Number.isFinite(latNum) ? latNum : undefined,
    lng: Number.isFinite(lngNum) ? lngNum : undefined,
    voteCnt: Number.isFinite(voteCntNum) ? voteCntNum : 0,
    isVoted: !!raw.isVoted,
    senderId,
    // 백호환: 기존 코드가 sendId를 참조해도 동작
    sendId: senderId,
    _roomId: raw.roomId,
  };
}

/** wantId → placeId 순으로 동일 항목 찾기 */
function findIndexById(list, p) {
  if (p.wantId != null) {
    const i = list.findIndex((x) => Number(x.wantId) === Number(p.wantId));
    if (i !== -1) return i;
  }
  if (p.placeId != null) {
    const i = list.findIndex((x) => Number(x.placeId) === Number(p.placeId));
    if (i !== -1) return i;
  }
  return -1;
}

const sharedPlaceSlice = createSlice({
  name: "sharedPlace",
  initialState,
  reducers: {
    /**
     * 전체 교체(초기 로딩/새로고침 포함)
     * - 이제 빈 배열이면 **정말 비웁니다** (stale 방지)
     * - 기존 imgUrl 보존 로직은 동일
     */
    setSharedPlaces(state, action) {
      const arr = Array.isArray(action.payload) ? action.payload : [];
      // 정규화(+ wantId/placeId 없는 것 필터)
      const normalized = arr
        .map(normalize)
        .filter((p) => p.wantId != null || p.placeId != null);

      if (normalized.length === 0) {
        state.sharedPlaces = [];
        return;
      }

      const prev = state.sharedPlaces || [];
      const merged = normalized.map((p) => {
        const i = findIndexById(prev, p);
        if (i === -1) return p;
        const old = prev[i];
        return { ...old, ...p, imgUrl: p.imgUrl ?? old.imgUrl };
      });
      state.sharedPlaces = merged;
    },

    /**
     * 단일 항목 추가/갱신 (웹소켓 수신)
     */
    addSharedPlace(state, action) {
      const p = normalize(action.payload ?? {});
      if (p.wantId == null && p.placeId == null) return;

      const idx = findIndexById(state.sharedPlaces, p);
      if (idx !== -1) {
        const old = state.sharedPlaces[idx];
        state.sharedPlaces[idx] = {
          ...old,
          ...p,
          imgUrl: p.imgUrl ?? old.imgUrl,
        };
      } else {
        state.sharedPlaces.push(p);
      }
    },

    /**
     * wantId 또는 placeId 기준 제거
     */
    removeSharedPlace(state, action) {
      const key = action.payload;
      if (typeof key === "number") {
        state.sharedPlaces = state.sharedPlaces.filter(
          (p) =>
            Number(p.wantId) !== Number(key) &&
            Number(p.placeId) !== Number(key)
        );
        return;
      }
      if (key && typeof key === "object") {
        const wantId = key.wantId != null ? Number(key.wantId) : undefined;
        const placeIdVal =
          key.placeId != null
            ? Number(normalizePlaceId(key.placeId))
            : undefined;

        state.sharedPlaces = state.sharedPlaces.filter((p) => {
          if (wantId != null) return Number(p.wantId) !== wantId;
          if (placeIdVal != null) return Number(p.placeId) !== placeIdVal;
          return true;
        });
      }
    },

    /** 전체 비우기 */
    resetSharedPlaces(state) {
      state.sharedPlaces = [];
    },
  },
});

export const {
  setSharedPlaces,
  addSharedPlace,
  removeSharedPlace,
  resetSharedPlaces,
} = sharedPlaceSlice.actions;

/** 기본 셀렉터들 */
export const selectSharedPlaces = (s) => s.sharedPlace.sharedPlaces;
export const selectSharedPlaceByWantId = (wantId) => (s) =>
  s.sharedPlace.sharedPlaces.find((p) => Number(p.wantId) === Number(wantId));

/** 🔧 버튼 비활성 판단에 쓰기 좋은 셀렉터들 */
export const selectIsSharedByPlaceId = (placeId) => (s) => {
  const pid = placeId != null ? Number(normalizePlaceId(placeId)) : undefined;
  if (!Number.isFinite(pid)) return false;
  return (s.sharedPlace.sharedPlaces || []).some(
    (p) => Number(p.placeId) === pid
  );
};

export const selectIsSharedByEither =
  ({ wantId, placeId }) =>
  (s) => {
    const wid = wantId != null ? Number(wantId) : undefined;
    const pid = placeId != null ? Number(normalizePlaceId(placeId)) : undefined;
    return (s.sharedPlace.sharedPlaces || []).some((p) => {
      return (
        (wid != null && Number(p.wantId) === wid) ||
        (pid != null && Number(p.placeId) === pid)
      );
    });
  };

export default sharedPlaceSlice.reducer;
