// src/redux/slices/uiSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // 경로 최적화 모달
  isRouteModalOpen: false,

  // 일정표(일차 카드) 패널/모달 공용 플래그
  isItineraryModalOpen: false,

  // TripCreateForm(여행 설정/날짜 변경)
  isTripFormOpen: false,

  // 초대 팝오버
  isInviteOpen: false,

  // 리뷰 작성 모달
  isReviewWriteOpen: false,
  reviewWriteTarget: null, // ✅ 리뷰 작성 대상(방) 정보
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    // 경로 모달
    openRouteModal: (s) => { s.isRouteModalOpen = true; },
    closeRouteModal: (s) => { s.isRouteModalOpen = false; },

    // 일정 모달(기존)
    openItineraryModal: (s) => { s.isItineraryModalOpen = true; },
    closeItineraryModal: (s) => { s.isItineraryModalOpen = false; },

    // 일정 패널 alias (같은 플래그 재사용)
    openItineraryPanel: (s) => { s.isItineraryModalOpen = true; },
    closeItineraryPanel: (s) => { s.isItineraryModalOpen = false; },

    // TripCreateForm
    openTripForm: (s) => { s.isTripFormOpen = true; },
    closeTripForm: (s) => { s.isTripFormOpen = false; },

    // 초대 팝오버
    openInvite: (s) => { s.isInviteOpen = true; },
    closeInvite: (s) => { s.isInviteOpen = false; },
    toggleInvite: (s) => { s.isInviteOpen = !s.isInviteOpen; },

    // 리뷰 작성 모달
    openReviewWrite: (s) => { s.isReviewWriteOpen = true; },
    closeReviewWrite: (s) => { s.isReviewWriteOpen = false; s.reviewWriteTarget = null; },
    toggleReviewWrite: (s) => { s.isReviewWriteOpen = !s.isReviewWriteOpen; },

    // ✅ 리뷰 모달 대상
    setReviewWriteTarget: (s, { payload }) => { s.reviewWriteTarget = payload ?? null; },
    clearReviewWriteTarget: (s) => { s.reviewWriteTarget = null; },
  },
});

export const {
  openRouteModal, closeRouteModal,
  openItineraryModal, closeItineraryModal,
  openItineraryPanel, closeItineraryPanel,
  openTripForm, closeTripForm,
  openInvite, closeInvite, toggleInvite,
  openReviewWrite, closeReviewWrite, toggleReviewWrite,
  setReviewWriteTarget, clearReviewWriteTarget,
} = uiSlice.actions;

export default uiSlice.reducer;

// 셀렉터
export const selectIsRouteOpen = (s) => s.ui.isRouteModalOpen;
export const selectIsItineraryOpen = (s) => s.ui.isItineraryModalOpen;
export const selectIsTripFormOpen = (s) => s.ui.isTripFormOpen;
export const selectIsInviteOpen = (s) => s.ui.isInviteOpen;
export const selectIsReviewWriteOpen = (s) => s.ui.isReviewWriteOpen;
export const selectReviewWriteTarget = (s) => s.ui.reviewWriteTarget;