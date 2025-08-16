import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./myTravelSpacePage.css";

import TravelRoomsTable from "../../features/myTravelSpace/ui/TravelRoomsTable";
import useTravelRooms from "../../features/myTravelSpace/model/useTravelRooms";
import MyTravelToolbar from "../../features/myTravelSpace/ui/MyTravelToolbar";
import SchedulePreview from "../../features/itinerary/ui/SchedulePreview"; // ✅ 추가

export default function MyTravelSpacePage({ items = [] }) {
  const navigate = useNavigate();
  const [viewTarget, setViewTarget] = useState(null); // ✅ 일정 모달 대상

  const toLocalDate = (s) => {
    if (!s) return null;
    const [y, m, d] = String(s).split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  };

  const statusOf = (it) => {
    const s = (it?.status || "").trim();
    if (s === "진행중") return "ongoing";
    if (s === "완료") return "done";

    const today = new Date();
    const end = toLocalDate(it?.endDate);
    if (end && end < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
      return "done";
    }
    return "ongoing";
  };

  const { rooms, loading, error, reload, leaveRoom, removeRoom } = useTravelRooms({
    endpoint: "/users/travel-rooms",
    useToken: false,
    initialFilter: "none",
  });

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const source = items.length ? items : rooms;

  useEffect(() => { setPage(1); }, [q, status]);

  const filtered = useMemo(() => {
    const byQuery = (it) => {
      if (!q.trim()) return true;
      const key = `${it.title ?? ""} ${it.region ?? ""}`.toLowerCase();
      return key.includes(q.trim().toLowerCase());
    };
    return (source || []).filter(
      (it) => (status === "all" || statusOf(it) === status) && byQuery(it)
    );
  }, [source, q, status]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  useEffect(() => {
    const newCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (page > newCount) setPage(newCount);
  }, [filtered.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEnter = (room) => {
    const id = room?.travelRoomId ?? room?.id ?? room?.roomId;
    if (!id) return;
    navigate(`/trip-room/${id}`);
  };

  const handleDelete = async (room) => {
    const id = Number(room?.id ?? room?.travelRoomId ?? room?.roomId);
    if (!Number.isFinite(id)) return;
    try {
      await leaveRoom(id, { optimistic: true });
    } catch (e) {
      const status = e?.response?.status;
      const message = e?.response?.data?.message || e?.message || "요청 실패";
      console.error("[Page] leave error", status, e?.response?.data || e);
      alert(`나가기에 실패했어요. (status: ${status ?? "?"}) ${message}`);
    }
  };

  const handleRemove = async (room) => {
    const id = Number(room?.id ?? room?.travelRoomId ?? room?.roomId);
    if (!Number.isFinite(id)) return;
    if (!window.confirm("정말로 이 여행 방을 삭제할까요? 되돌릴 수 없습니다.")) return;

    try {
      const optimistic = room?.isOwner || room?.canDelete || false;
      await removeRoom(id, { optimistic: true });
      // 필요 시 서버 재동기화: await reload();
    } catch (e) {
      const status = e?.response?.status;
      const message =
        status === 403
          ? "방장만 삭제할 수 있어요."
          : e?.response?.data?.message || e?.message || "요청 실패";
      console.error("[Page] remove error", status, e?.response?.data || e);
      alert(message);
    }
  };

  return (
    <div className="travel-page">
      <MyTravelToolbar q={q} onChangeQ={setQ} status={status} onChangeStatus={setStatus} />

      <div className="travel-card">
        {loading ? (
          <div className="travel-empty"><p className="empty-text">불러오는 중…</p></div>
        ) : error ? (
          <div className="travel-empty">
            <p className="empty-text">목록을 불러오지 못했습니다.</p>
            <button className="pg-btn" onClick={reload}>다시 시도</button>
          </div>
        ) : (
          <TravelRoomsTable
            rooms={pageItems}
            onEnter={handleEnter}
            onDelete={handleDelete}
            onRemove={handleRemove}
            onViewSchedule={(room) => setViewTarget(room)} // ✅ 일정 조회 연결
          />
        )}
      </div>

      {!loading && !error && (
        <div className="travel-pagination">
          <div className="pg-info">Page {page} of {pageCount}</div>
          <div className="pg-pages" role="navigation" aria-label="페이지네이션">
            <button className="pg-btn" onClick={() => setPage(1)} disabled={page === 1} aria-label="첫 페이지">«</button>
            <button className="pg-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label="이전 페이지">‹</button>
            {Array.from({ length: Math.min(pageCount, 7) }, (_, i) => i + 1).map((slot) => (
              <button
                key={slot}
                className={`pg-num ${page === slot ? "is-active" : ""}`}
                onClick={() => setPage(slot)}
                aria-current={page === slot ? "page" : undefined}
              >
                {slot}
              </button>
            ))}
            <button className="pg-btn" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount} aria-label="다음 페이지">›</button>
            <button className="pg-btn" onClick={() => setPage(pageCount)} disabled={page === pageCount} aria-label="마지막 페이지">»</button>
          </div>
        </div>
      )}

      {/* ✅ 일정 조회 모달 */}
      {viewTarget && (
        <SchedulePreview
          room={viewTarget}
          onClose={() => setViewTarget(null)}
        />
      )}
    </div>
  );
}
