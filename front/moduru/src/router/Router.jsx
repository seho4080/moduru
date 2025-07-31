// builtin
import React from "react";

// external
import { BrowserRouter, Routes, Route } from "react-router-dom";

// internal
import MainPageLayout from "../pages/mainPage/MainPageLayout";
import TripRoomPage from "../pages/tripRoomPage/TripRoomPage";

const RouterComponent = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPageLayout />} />
        <Route path="/trip-room" element={<TripRoomPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default RouterComponent;
