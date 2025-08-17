// src/pages/mainPage/ui/TravelRoomsModal.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../lib/axios";
import useTravelRooms from "../../../features/myTravelSpace/model/useTravelRooms";
import "../css/travelRoomsModal.css";

/** 매우 가벼운 auth 준비 체크 */
/** 매우 가벼운 auth 준비 체크 + 1회 강제 재발급 */
function useAuthReady(whenOpen) {
  const [authReady, setReady] = useState(false);
  const [isAuthenticated, setAuthed] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!whenOpen) { setReady(false); setAuthed(false); return; }

    (async () => {
      // 1) access token이 있으면 즉시 OK
      const access = localStorage.getItem("accessToken");
      if (access) {
        if (!alive) return;
        setAuthed(true);
        setReady(true);
        return;
      }

      // 2) 쿠키 인증: has-refresh로 확인
      try {
        await api.get("/auth/has-refresh", { withCredentials: true });
        if (!alive) return;
        setAuthed(true);
        setReady(true);
        return;
      } catch {
        // 3) has-refresh 401 → 1회 강제 재발급 시도
        try {
          await api.post("/auth/reissue", null, { withCredentials: true });
          if (!alive) return;
          setAuthed(true);
        } catch {
          if (!alive) return;
          setAuthed(false);
        } finally {
          if (!alive) return;
          setReady(true);
        }
      }
    })();

    return () => { alive = false; };
  }, [whenOpen]);

  return { authReady, isAuthenticated };
}


export default function TravelRoomsModal({ isOpen, onClose }) {
  // Esc 닫기
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // 인증 준비가 끝났고 인증된 경우에만 목록 훅 활성화
  const { authReady, isAuthenticated } = useAuthReady(isOpen);
  const canMountList = isOpen && authReady && isAuthenticated;

  // 목록 훅(🔥 핵심: enabled로 마운트 타이밍 제어)
  const { rooms, loading, error, reload } = useTravelRooms({
    enabled: canMountList,
    endpoint: "/users/travel-rooms",
    useToken: false, // 쿠키 인증이면 false 유지
  });

  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // 오늘 00:00
  const today00 = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  // 진행 중/미종료 방 필터
  const activeRooms = useMemo(() => {
    return (rooms || []).filter((room) => {
      if (!room?.endDate) return true;
      const endDate = new Date(room.endDate);
      return endDate >= today00;
    });
  }, [rooms, today00]);

  const totalPages = Math.max(1, Math.ceil(activeRooms.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRooms = activeRooms.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const getVisiblePages = useCallback(() => {
    if (totalPages <= 3) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage === 1) return [1, 2, 3];
    if (currentPage === totalPages) return [totalPages - 2, totalPages - 1, totalPages];
    return [currentPage - 1, currentPage, currentPage + 1];
  }, [currentPage, totalPages]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return date
      .toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
      .replace(/\./g, ".")
      .replace(/ /g, "");
  };
  const formatDateRange = (startDate, endDate) => {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    if (start && end) return `${start} ~ ${end}`;
    if (start) return start;
    if (end) return `~ ${end}`;
    return "날짜 미정";
  };

  const handleRoomClick = (room) => {
    onClose?.();
    navigate(`/trip-room/${room.id}`);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="travel-rooms-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">참여 중인 방 목록</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="닫기">✕</button>
        </div>

        <div className="modal-content">
          {/* 준비 전 상태 */}
          {!authReady && (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>인증 준비 중...</p>
            </div>
          )}

          {/* 인증 실패 상태 */}
          {authReady && !isAuthenticated && (
            <div className="error-state">
              <p>로그인이 필요합니다.</p>
            </div>
          )}

          {/* 정상 목록 */}
          {canMountList && (
            <>
              {loading && (
                <div className="loading-state">
                  <div className="loading-spinner" />
                  <p>로딩 중...</p>
                </div>
              )}

              {!loading && error && (
                <div className="error-state">
                  <p>오류가 발생했습니다: {error?.message ?? "알 수 없는 오류"}</p>
                  <button className="pagination-btn" onClick={reload}>다시 시도</button>
                </div>
              )}

              {!loading && !error && activeRooms.length === 0 && (
                <div className="empty-state">
                  <p>참여 중인 방이 없습니다.</p>
                </div>
              )}

              {!loading && !error && activeRooms.length > 0 && (
                <>
                  <div className="rooms-grid">
                    {currentRooms.map((room) => (
                      <button
                        type="button"
                        key={room.id}
                        className="room-card"
                        onClick={() => handleRoomClick(room)}
                      >
                        <div className="room-card-content">
                          <h3 className="room-title">{room.title || "제목 없음"}</h3>
                          <p className="room-region">{room.region || "지역 미정"}</p>
                          <p className="room-dates">{formatDateRange(room.startDate, room.endDate)}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="pagination">
                      <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        aria-label="이전 페이지"
                      >
                        &lt;
                      </button>

                      {getVisiblePages().map((pageNum) => (
                        <button
                          key={pageNum}
                          className={`pagination-btn ${currentPage === pageNum ? "active" : ""}`}
                          onClick={() => setCurrentPage(pageNum)}
                          aria-current={currentPage === pageNum ? "page" : undefined}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        aria-label="다음 페이지"
                      >
                        &gt;
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
