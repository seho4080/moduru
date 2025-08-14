// src/redux/slices/uiSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // 기존
  isRouteModalOpen: false,
  isItineraryModalOpen: false,
  isTripFormOpen: false,

  // 초대 팝오버
  isInviteOpen: false,

  // 리뷰 작성(여행 경험 공유하기) 모달
  isReviewWriteOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    // NOTE: 경로/일정/여행 폼
    openRouteModal: (s) => { s.isRouteModalOpen = true; },
    closeRouteModal: (s) => { s.isRouteModalOpen = false; },

    openItineraryModal: (s) => { s.isItineraryModalOpen = true; },
    closeItineraryModal: (s) => { s.isItineraryModalOpen = false; },

    openTripForm: (s) => { s.isTripFormOpen = true; },
    closeTripForm: (s) => { s.isTripFormOpen = false; },

    // NOTE: 초대 팝오버
    openInvite: (s) => { s.isInviteOpen = true; },
    closeInvite: (s) => { s.isInviteOpen = false; },
    toggleInvite: (s) => { s.isInviteOpen = !s.isInviteOpen; },

    // NOTE: 리뷰 작성 모달
    openReviewWrite: (s) => { s.isReviewWriteOpen = true; },
    closeReviewWrite: (s) => { s.isReviewWriteOpen = false; },
    toggleReviewWrite: (s) => { s.isReviewWriteOpen = !s.isReviewWriteOpen; },

  },
});

export const {
  openRouteModal, closeRouteModal,
  openItineraryModal, closeItineraryModal,
  openTripForm, closeTripForm,
  openInvite, closeInvite, toggleInvite,
  openReviewWrite, closeReviewWrite, toggleReviewWrite,
} = uiSlice.actions;

export default uiSlice.reducer;

// NOTE: 셀렉터
export const selectIsReviewWriteOpen = (state) => state.ui.isReviewWriteOpen;

