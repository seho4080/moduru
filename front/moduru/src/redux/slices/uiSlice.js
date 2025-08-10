import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // 경로 최적화 모달
  isRouteModalOpen: false,

  // 일정표(일차 카드) 모달
  isItineraryModalOpen: false,

  // TripCreateForm(여행 설정/날짜 변경) 폼 - 전역 싱글톤
  isTripFormOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    // 경로 모달
    openRouteModal: (s) => { s.isRouteModalOpen = true; },
    closeRouteModal: (s) => { s.isRouteModalOpen = false; },

    // 일정표 모달
    openItineraryModal: (s) => { s.isItineraryModalOpen = true; },
    closeItineraryModal: (s) => { s.isItineraryModalOpen = false; },

    // TripCreateForm (사이드탭/모달 공용)
    openTripForm: (s) => { s.isTripFormOpen = true; },
    closeTripForm: (s) => { s.isTripFormOpen = false; },
  },
});

export const {
  openRouteModal, closeRouteModal,
  openItineraryModal, closeItineraryModal,
  openTripForm, closeTripForm,
} = uiSlice.actions;

export default uiSlice.reducer;

// onClick={() => dispatch(openItineraryModal())}
// <ItineraryModal onClose={() => dispatch(closeItineraryModal())} />
