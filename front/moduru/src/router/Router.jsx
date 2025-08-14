// builtin
import React from "react";

// external
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// internal
import MainPageLayout from "../pages/mainPage/MainPageLayout";
import TripRoomPage from "../pages/tripRoomPage/TripRoomPage";
import MyPageLayout from "../pages/myPage/MyPageLayout";
import MyTravelSpacePage from "../pages/myPage/MyTravelSpacePage";
import MyPageHome from "../pages/myPage/MyPageHome";  
import MyReviewPage from "../pages/myPage/MyReviewPage";
import InvitePage from "../pages/invitePage/InvitePage";

const RouterComponent = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPageLayout />} />


        <Route path="/my-page" element={<MyPageLayout />}>
          <Route index element={<MyPageHome />} /> 
          <Route path="/my-page/my-reviews" element={<MyReviewPage />} />
        </Route>

        <Route path="/my-page/my-travel-space" element={<MyTravelSpacePage />} />

        <Route path="/trip-room/:id" element={<TripRoomPage />} />
        <Route path="/invite/:inviteToken" element={<InvitePage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default RouterComponent;
