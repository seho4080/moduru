// src/features/reviewWrite/ReviewWriteHost.jsx
import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import ReviewWrite from "./ReviewWrite";
import {
  selectIsReviewWriteOpen,
  selectReviewWriteTarget,
  openReviewWrite,
  closeReviewWrite,
} from "../../redux/slices/uiSlice";
import api from "../../lib/axios";
import { getRoomSchedulePlaces } from "./lib/reviewApi";

// YYYY-MM-DD → 로컬 00:00 Date
const toLocalDate = (s) => {
  if (!s) return null;
  const [y, m, d] = String(s).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
};

// 종료일 < 오늘(00:00) → 종료 판단
const isDone = (room) => {
  const today = new Date();
  const today00 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = toLocalDate(room?.endDate);
  return !!(end && end < today00);
};

export default function ReviewWriteHost() {
  const dispatch = useDispatch();
  const open = useSelector(selectIsReviewWriteOpen);
  const target = useSelector(selectReviewWriteTarget);

  // target만 세팅해도 자동으로 모달 오픈
  useEffect(() => {
    if (target?.roomId && !open) dispatch(openReviewWrite());
  }, [target?.roomId, open, dispatch]);

  // 과거(종료) 여행 목록
  const fetchTrips = async () => {
    try {
      const res = await api.get("/users/travel-rooms", { withCredentials: true });
      const rooms = Array.isArray(res.data) ? res.data : [];
      return rooms.filter(isDone).map((r) => ({
        id: r?.travelRoomId ?? r?.id ?? r?.roomId,
        title: r?.title ?? "(제목 없음)",
        period: r?.startDate && r?.endDate ? `${r.startDate} ~ ${r.endDate}` : null,
      }));
    } catch (e) {
      console.error("[ReviewWriteHost] fetchTrips error:", e?.response?.data || e);
      return [];
    }
  };

  // 여행별 방문 장소 (백엔드가 placeId/카테고리 제공)
  const fetchPlacesByTrip = async (tripId) => {
    try {
      return await getRoomSchedulePlaces(tripId);
    } catch (e) {
      console.error("[ReviewWriteHost] fetchPlacesByTrip error:", e?.response?.data || e);
      return [];
    }
  };

  // 리스트에서 넘어온 대상 → 프리셀렉트
  const initialTrip = useMemo(() => {
    if (!target?.roomId) return null;
    return {
      id: target.roomId,
      title: target.title ?? "(제목 없음)",
      period:
        target.startDate && target.endDate
          ? `${target.startDate} ~ ${target.endDate}`
          : target.period ?? null,
    };
  }, [target]);

  return (
    <ReviewWrite
      open={open}
      onClose={() => dispatch(closeReviewWrite())}
      onStart={() => dispatch(closeReviewWrite())}
      fetchTrips={fetchTrips}
      fetchPlacesByTrip={fetchPlacesByTrip}
      initialTrip={initialTrip}
    />
  );
}
