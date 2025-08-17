// src/pages/myTravelSpacePage/MyTravelSpacePage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./myTravelSpacePage.css";

// 필요 컴포넌트/훅 경로는 프로젝트 구조에 맞게 조정
import TravelRoomsTable from "../../features/myTravelSpace/ui/TravelRoomsTable";
import SchedulePreview from "../../features/myTravelSpace/ui/SchedulePreview";
import { useTravelRooms } from "../../features/myTravelSpace/lib/useTravelRooms";

/* ===== 날짜 유틸 ===== */
// "YYYY-MM-DD" → Date(로컬 00:00)
function toLocalDate(ymd) {
  if (!ymd) return null;
  const m = String(ymd).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]) - 1, d = Number(m[3]);
  return new Date(y, mo, d);
}

// 오늘(로컬 00:00)
function todayStart() {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

/* 상태: pre(시작 전)/ongoing(진행중)/done(종료) */
function statusOf(room) {
  const start = toLocalDate(room?.startDate);
  const end = toLocalDate(room?.endDate);
  const today = todayStart();
  if (end && end < today) return "done";
  if (start && start > today) return "pre";
  return "ongoing";
}

export default function MyTravelSpacePage({ items = [] }) {
  const navigate = useNavigate();

  /* ===== 서버 데이터 ===== */
  const { rooms: fetchedRooms, loading, error, reload, leaveRoom, removeRoom } = useTravelRooms({
    endpoint: "/users/travel-rooms",
    useToken: false, // 쿠키 세션이면 false 유지
  });

  // 외부에서 items를 넣어주면 우선 사용, 없으면 API 결과 사용
  const source = items.length ? items : (fetchedRooms || []);

  /* ===== 검색/필터 ===== */
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all"); // all | pre | ongoing | done

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

  /* ===== 페이지네이션 (컨테이너 높이에 맞춰 pageSize 자동계산) ===== */
  const containerRef = useRef(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8); // 초기값
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // 대략적인 행 높이와 헤더/패딩 추정값
    const ROW_H = 64;         // .travel-row 예상 높이
    const HEADER_H = 56;      // 테이블 헤더 + 상단 여백
    const PADDING = 24 + 24;  // 위아래 패딩

    const ro = new ResizeObserver(() => {
      const h = el.clientHeight || 0;
      const usable = Math.max(0, h - HEADER_H - PADDING);
      const rows = Math.max(4, Math.floor(usable / ROW_H)); // 최소 4행 보장
      setPageSize(rows);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    // 필터/검색이 바뀌면 첫 페이지로
    setPage(1);
  }, [q, status]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  /* ===== 이동/삭제/탈퇴 핸들러 ===== */
  const handleEnter = (id) => {
    if (!id) return;
    navigate(`/rooms/${id}`);
  };

  const handleDelete = async (id) => {
    // 방 탈퇴(멤버 나가기)
    if (!window.confirm("정말로 이 여행 방에서 나가시겠습니까?")) return;
    try {
      await leaveRoom(id, { optimistic: true });
    } catch (e) {
      const code = e?.response?.data?.code;
      const msg =
        code === "ROOM_CANNOT_LEAVE_ONLY_OWNER"
          ? "방장이 유일한 멤버일 때는 탈퇴할 수 없습니다."
          : (e?.response?.data?.message || "탈퇴 중 문제가 발생했습니다.");
      alert(msg);
    }
  };

  const handleRemove = async (id) => {
    // 방 삭제(소유자만)
    if (!window.confirm("정말로 이 여행 방을 삭제할까요? 되돌릴 수 없습니다.")) return;
    try {
      await removeRoom(id, { optimistic: true });
      // 필요 시 서버 재동기화: await reload();
    } catch (e) {
      const msg = e?.response?.data?.message || "삭제 중 문제가 발생했습니다.";
      alert(msg);
    }
  };

  /* ===== 일정 미리보기 모달 ===== */
  const [viewTarget, setViewTarget] = useState(null);

  return (
    <div className="mypage-main">
      {/* 검색/필터 UI는 프로젝트 스타일에 맞게 배치 */}
      <div className="travel-toolbar">
        <input
          className="search-input"
          placeholder="제목·지역 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="status-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">전체</option>
          <option value="pre">시작 전</option>
          <option value="ongoing">진행 중</option>
          <option value="done">종료</option>
        </select>
      </div>

      <div className="travel-card">
        {/* 헤더 */}
        <div className="travel-head">
          <h2 className="travel-title">내 여행방</h2>
          <div className="travel-meta">
            총 {filtered.length}개 · 페이지 {page} / {pageCount}
          </div>
        </div>

        {/* 본문(컨테이너 높이에 맞춰 rows 계산) */}
        <div className="travel-body" ref={containerRef} style={{ overflow: "hidden" }}>
          {loading ? (
            <div className="pg-empty">불러오는 중…</div>
          ) : error ? (
            <div className="pg-empty">
              데이터를 불러오지 못했습니다.
              <button className="pg-btn" onClick={reload}>다시 시도</button>
            </div>
          ) : (
            <TravelRoomsTable
              rooms={pageItems}
              onEnter={handleEnter}
              onDelete={handleDelete}
              onRemove={handleRemove}
              onViewSchedule={(room) => setViewTarget(room)} // ✅ 일정 조회 연결
              getStatus={statusOf}
            />
          )}
        </div>

        {/* 페이지네이션 */}
        {pageCount > 1 && (
          <div className="pg">
            <button className="pg-btn" onClick={() => setPage(1)} disabled={page === 1} aria-label="첫 페이지">«</button>
            <button className="pg-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label="이전 페이지">‹</button>
            <span className="pg-info">{page} / {pageCount}</span>
            <button className="pg-btn" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount} aria-label="다음 페이지">›</button>
            <button className="pg-btn" onClick={() => setPage(pageCount)} disabled={page === pageCount} aria-label="마지막 페이지">»</button>
          </div>
        )}
      </div>

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
