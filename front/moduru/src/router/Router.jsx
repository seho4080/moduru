// builtin
import React from "react";

// external
import { BrowserRouter, Routes, Route } from "react-router-dom";

// internal
// import MainPageLayout from "../pages/mainPage/MainPageLayout";
import MainPageLayout from "../pages/mainPage/MainPage";
import TripRoomPage from "../pages/tripRoomPage/TripRoomPage";
// import MyPageLayout from "../pages/myPage/MyPageLayout";
import MyPageLayout from "../pages/myPage/MyPage";
// import MyTravelSpacePage from "../pages/myPage/MyTravelSpacePage";
import MyTravelSpacePage from "../pages/myTravelSpacePage/MyTravelSpacePage";
// import MyLikePlace from "../pages/myLikePlacePage/MyLikePlacePage";
import InvitePage from '../pages/invitePage/InvitePage';
import MyPageHome from "../pages/myPage/MyPageHome";  
import MyReviewPage from "../pages/myPage/MyReviewPage";



const RouterComponent = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPageLayout />} />
        {/* <Route path="/trip-room" element={<TripRoomPage />} /> */}
        <Route path="/my-page" element={<MyPageLayout />}>
          <Route index element={<MyPageHome />} /> 
          <Route path="/my-page/my-reviews" element={<MyReviewPage />} />
        </Route>
        <Route
          path="/my-page/my-travel-space"
          element={<MyTravelSpacePage />}
        />
        {/* <Route
          path="/my-page/my-places"
          element={<MyLikePlace />}
        /> */}
        <Route path="/trip-room/:id" element={<TripRoomPage />} />
        <Route path="/invite/:inviteToken" element={<InvitePage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default RouterComponent;
