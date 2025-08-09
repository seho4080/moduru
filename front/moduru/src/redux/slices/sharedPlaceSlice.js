// src/redux/slices/sharedPlaceSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  /** @type {Array<{
   *  wantId?: number,
   *  placeId?: number,
   *  placeName: string,
   *  imgUrl: string,
   *  category: string,
   *  address?: string,
   *  lat?: number,
   *  lng?: number,
   *  voteCnt: number,
   *  isVoted?: boolean,
   *  sendId?: string,
   *  _roomId?: number|string
   * }>} */
  sharedPlaces: [],
};

// placeId가 객체로 오는 케이스 방지
const normalizePlaceId = (placeId) =>
  placeId && typeof placeId === "object" ? placeId.placeId : placeId;

/**
 * 서버/웹소켓 메시지를 내부 포맷으로 정규화
 * 메시지 구조: { type, id, roomId, wantId, sendId, category, placeName, address, lat, lng, imgUrl, isVoted, voteCnt, [placeId] }
 */
function normalize(raw = {}) {
  const wantId =
    raw.wantId != null
      ? Number(raw.wantId)
      : raw.id != null
      ? Number(raw.id)
      : undefined;

  const placeIdNum =
    raw.placeId != null ? Number(normalizePlaceId(raw.placeId)) : undefined;
  const placeId = Number.isFinite(placeIdNum) ? placeIdNum : undefined;

  const latNum = raw.lat != null ? Number(raw.lat) : undefined;
  const lngNum = raw.lng != null ? Number(raw.lng) : undefined;

  const voteCntNum =
    raw.voteCnt != null
      ? Number(raw.voteCnt)
      : raw.likeCount != null
      ? Number(raw.likeCount)
      : 0;

  return {
    wantId,
    placeId,
    placeName: raw.placeName ?? raw.name ?? "",
    imgUrl: raw.imgUrl ?? raw.imageUrl ?? "",
    category: raw.category ?? raw.type ?? "",
    address: raw.address ?? "",
    lat: Number.isFinite(latNum) ? latNum : undefined,
    lng: Number.isFinite(lngNum) ? lngNum : undefined,
    voteCnt: Number.isFinite(voteCntNum) ? voteCntNum : 0,
    isVoted: !!raw.isVoted,
    sendId: raw.sendId,
    _roomId: raw.roomId, // 디버깅용 보존
    // 원본의 나머지 필드도 보존하고 싶다면 아래 주석 해제
    // ...raw,
  };
}

// 업서트 매칭: wantId > placeId
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
    // 초기 로딩/전체 교체: 빈 배열이면 유지(덮어쓰기 금지)
    setSharedPlaces(state, action) {
      const arr = Array.isArray(action.payload) ? action.payload : [];
      if (arr.length === 0) {
        // 빈 응답이면 기존 상태 유지
        return;
      }
      const normalized = arr
        .map(normalize)
        .filter((p) => p.wantId != null || p.placeId != null);
      state.sharedPlaces = normalized;
    },

    // 실시간 추가/갱신(웹소켓 수신 등): 업서트
    addSharedPlace(state, action) {
      const p = normalize(action.payload ?? {});
      if (p.wantId == null && p.placeId == null) return;

      const idx = findIndexById(state.sharedPlaces, p);
      if (idx !== -1) {
        state.sharedPlaces[idx] = { ...state.sharedPlaces[idx], ...p };
      } else {
        state.sharedPlaces.push(p);
      }
    },

    // 제거: wantId 우선, 없으면 placeId도 허용
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
        return;
      }
      // 그 외 타입은 무시
    },

    // 명시적 상황(로그아웃/방 나가기)에서만 호출
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

// 선택자
export const selectSharedPlaces = (s) => s.sharedPlace.sharedPlaces;
export const selectSharedPlaceByWantId = (wantId) => (s) =>
  s.sharedPlace.sharedPlaces.find((p) => Number(p.wantId) === Number(wantId));

export default sharedPlaceSlice.reducer;
