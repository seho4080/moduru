// builtin
import React from "react";

// external
import { BrowserRouter, Routes, Route } from "react-router-dom";

// internal
import MainPageLayout from "../pages/mainPage/MainPageLayout";
import TripRoomPage from "../pages/tripRoomPage/TripRoomPage";
import MyPageLayout from "../pages/myPage/MyPageLayout";
import MyTravelSpacePage from "../pages/myPage/MyTravelSpacePage";

const RouterComponent = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPageLayout />} />
        <Route path="/trip-room" element={<TripRoomPage />} />
        <Route path="/my-page" element={<MyPageLayout />} />
        <Route
          path="/my-page/my-travel-space"
          element={<MyTravelSpacePage />}
        />
        <Route path="/trip-room/:id" element={<TripRoomPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default RouterComponent;
