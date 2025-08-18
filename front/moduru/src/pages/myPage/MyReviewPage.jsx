// src/pages/MyReviewPage.jsx
import React from "react";
import "./myReviewPage.css";
import ReviewWrite from "../../features/reviewWrite/ReviewWrite";
import { useDispatch, useSelector } from "react-redux";
import {
  openReviewWrite,
  closeReviewWrite,
  selectIsReviewWriteOpen,
} from "../../redux/slices/uiSlice";
import MyReviewsList from "../../features/myReview/ui/MyReviewsList";

export default function MyReviewPage() {
  const dispatch = useDispatch();
  const open = useSelector(selectIsReviewWriteOpen);

  // 임시 데이터 (모달 더미)
  const fetchTrips = async () => [
    { id: 1, title: "제주 봄여행", period: "2024-04-12 ~ 04-15" },
    { id: 2, title: "부산 미식투어", period: "2023-10-01 ~ 10-03" },
  ];
  const fetchPlacesByTrip = async (tripId) =>
    tripId === 1
      ? [{ id: "a", name: "협재해변", address: "제주시 한림읍" }]
      : [{ id: "b", name: "광안리", address: "부산 수영구" }];

  return (
    <div className="w-full">
      {/* 상단 영역 */}
      <div className="myreview-header">
        <h2 className="myreview-title">작성한 리뷰</h2>
        <button
          className="myreview-btn"
          type="button"
          onClick={() => dispatch(openReviewWrite())}
        >
          과거 여행
        </button>
      </div>

      {/* 구분선 */}
      <hr className="border-gray-300 mb-4" />

      <MyReviewsList  />

      {/* 모달 */}
      <ReviewWrite
        open={open}
        onClose={() => dispatch(closeReviewWrite())}
        onStart={() => dispatch(closeReviewWrite())}
        fetchTrips={fetchTrips}
        fetchPlacesByTrip={fetchPlacesByTrip}
      />
    </div>
  );
}
