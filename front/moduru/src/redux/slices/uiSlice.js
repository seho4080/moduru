// src/redux/slices/uiSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isRouteModalOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openRouteModal(state) {
      state.isRouteModalOpen = true;
    },
    closeRouteModal(state) {
      state.isRouteModalOpen = false;
    },
  },
});

export const { openRouteModal, closeRouteModal } = uiSlice.actions;
export default uiSlice.reducer;
