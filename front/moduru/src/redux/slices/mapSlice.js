// src/redux/slices/mapSlice.js

// external
import { createSlice } from "@reduxjs/toolkit";

/**
 * 지도 관련 상태를 관리하는 Redux Slice
 * - 핀 목록 관리 (추가, 삭제)
 * - 선택된 장소 및 지도 이동 좌표 관리
 * - 지도 중심 좌표 관리
 */
const mapSlice = createSlice({
  name: "map",

  /**
   * NOTE: 초기 상태는 핀 목록, 선택된 장소, 핀 좌표,
   *       지도 중심, 마지막 변경 시각을 포함
   * @type {{
   *   pins: { id: string, lat: number, lng: number }[],
   *   selectedPlace: object | null,
   *   pinCoords: { lat: number, lng: number } | null,
   *   center: { lat: number, lng: number },
   *   lastChangedAt: number
   * }}
   */
  initialState: {
    pins: [],
    selectedPlace: null,
    pinCoords: null,
    center: { lat: 37.5665, lng: 126.9780 }, // NOTE: 기본 중심(서울 시청 근처)
    lastChangedAt: 0,                         // NOTE: 동일 좌표 재지정 트리거용
  },

  reducers: {
    /**
     * NOTE: 새 핀을 추가
     * @param {import('immer').Draft} state
     * @param {import('@reduxjs/toolkit').PayloadAction<{ id: string, lat: number, lng: number }>} action
     */
    addPin: (state, action) => {
      state.pins.push(action.payload);
    },

    /**
     * NOTE: 주어진 ID의 핀을 삭제
     * @param {import('immer').Draft} state
     * @param {import('@reduxjs/toolkit').PayloadAction<string>} action
     */
    removePin: (state, action) => {
      state.pins = state.pins.filter((pin) => pin.id !== action.payload);
    },

    /**
     * NOTE: 사용자가 클릭한 장소를 상태로 저장
     * @param {import('immer').Draft} state
     * @param {import('@reduxjs/toolkit').PayloadAction<object>} action
     */
    setSelectedPlace: (state, action) => {
      state.selectedPlace = action.payload;
    },

    /**
     * NOTE: 선택된 장소의 좌표를 저장 (지도 중심 이동 및 핀 표시용)
     * @param {import('immer').Draft} state
     * @param {import('@reduxjs/toolkit').PayloadAction<{ lat: number, lng: number }>} action
     */
    setPinCoords: (state, action) => {
      state.pinCoords = action.payload;
    },

    /**
     * NOTE: 장소 상세 패널을 닫을 때 상태 초기화
     * @param {import('immer').Draft} state
     */
    clearSelectedPlace: (state) => {
      state.selectedPlace = null;
      state.pinCoords = null;
    },

    /**
     * NOTE: 지도 중심 좌표를 설정
     * @param {import('immer').Draft} state
     * @param {import('@reduxjs/toolkit').PayloadAction<{ lat: number, lng: number }>} action
     */
    setMapCenter: (state, action) => {
      const { lat, lng } = action.payload || {};
      if (typeof lat === "number" && typeof lng === "number") {
        state.center = { lat, lng };
        state.lastChangedAt = Date.now();
      }
    },
  },
});

export const {
  addPin,
  removePin,
  setSelectedPlace,
  setPinCoords,
  clearSelectedPlace,
  setMapCenter,
} = mapSlice.actions;

// NOTE: 셀렉터
export const selectMapCenter = (state) => state.map.center;
export const selectMapTick   = (state) => state.map.lastChangedAt;

export default mapSlice.reducer;
