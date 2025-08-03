// builtin
import React from "react";

// external
import { BrowserRouter, Routes, Route } from "react-router-dom";

// internal
import MainPageLayout from "../pages/mainPage/MainPageLayout";
import TripRoomPage from "../pages/tripRoomPage/TripRoomPage";
// tailwind 확인
import TestTailWind from "../pages/exTailwind";

const RouterComponent = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPageLayout />} />
        <Route path="/trip-room" element={<TripRoomPage />} />
        <Route path="/test-tailwind" element={<TestTailWind />} />
        {/* 테스트 경로(실행되면 삭제) */}
      </Routes>
    </BrowserRouter>
  );
};

export default RouterComponent;
