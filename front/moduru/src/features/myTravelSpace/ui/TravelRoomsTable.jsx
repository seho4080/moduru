// src/features/myTravelSpace/ui/TravelRoomsTable.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { openReviewWrite, setReviewWriteTarget } from "../../../redux/slices/uiSlice";
import durumiImg from "../../../assets/durumi.png";
import "./myTravelSpace.css";

function fmt(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// YYYY-MM-DD 또는 ISO 앞부분만 파싱(로컬 00:00)
const parseYMD = (s) => {
  if (!s) return null;
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
};
// 종료일 < 오늘(00:00) → 종료
const isEnded = (endDate) => {
  if (!endDate) return false;
  const end = parseYMD(endDate) ?? new Date(endDate);
  if (Number.isNaN(end?.getTime?.())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return end < today;
};

/**
 * props:
 * - rooms: 배열
 * - onEnter?: (room) => void
 * - onViewSchedule?: (room) => void
 * - onDelete?: (room) => Promise<void> | void   // 나가기(탈퇴)
 * - onRemove?: (room) => Promise<void> | void   // 삭제(방 자체 삭제)
 * - onWriteReview?: (room) => void              // 있으면 우선 사용
 */
export default function TravelRoomsTable({
  rooms = [],
  onEnter,
  onViewSchedule,
  onDelete,
  onRemove,
  onWriteReview,
}) {
  const dispatch = useDispatch();

  const [localRooms, setLocalRooms] = useState(rooms);
  useEffect(() => setLocalRooms(rooms), [rooms]);

  const hasData = localRooms && localRooms.length > 0;
  const [openMenuKey, setOpenMenuKey] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

  // 바깥 클릭/ESC → 메뉴 닫기
  useEffect(() => {
    const onDocPointer = (e) => {
      const t = e.target;
      if (t.closest?.(".more-wrap") || t.closest?.(".more-menu-portal")) return;
      setOpenMenuKey(null);
    };
    const onKey = (e) => e.key === "Escape" && setOpenMenuKey(null);

    document.addEventListener("pointerdown", onDocPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDocPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const rows = useMemo(
    () =>
      (localRooms || []).map((r) => ({
        key: r.id ?? `${r.title}-${r.createdAt}`,
        raw: r,
        title: r.title || "(제목 없음)",
        region: r.region || "-",
        period:
          r.startDate && r.endDate
            ? `${fmt(r.startDate)} ~ ${fmt(r.endDate)}`
            : "-",
        memberCount: Array.isArray(r.members) ? r.members.length : 0,
      })),
    [localRooms]
  );

  const handleEnter = (room) => (onEnter ? onEnter(room) : undefined);
  const handleView = (room) => (onViewSchedule ? onViewSchedule(room) : undefined);

  // ✅ 리뷰 모달 오픈 (prop 있으면 그걸 쓰고, 없으면 전역 디스패치)
  const handleReview = (room) => {
    if (onWriteReview) return onWriteReview(room);
    const id = room?.travelRoomId ?? room?.id ?? room?.roomId;
    if (!id) return;
    const period =
      room?.startDate && room?.endDate
        ? `${fmt(room.startDate)} ~ ${fmt(room.endDate)}`
        : null;

    dispatch(setReviewWriteTarget({
      roomId: id,
      title: room?.title ?? "",
      startDate: room?.startDate ?? null,
      endDate: room?.endDate ?? null,
      period,
    }));
    dispatch(openReviewWrite());
  };

  // 나가기(탈퇴)
  const handleLeave = async (room) => {
    setOpenMenuKey(null);
    if (!onDelete) return;
    try {
      await onDelete(room);
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || "요청 실패";
      console.error("[TravelRoomsTable] leave error:", status, e?.response?.data || e);
      alert(`나가기에 실패했어요. (status: ${status ?? "?"}) ${msg}`);
    }
  };

  // 삭제(방 자체 삭제)
  const handleRemove = async (room) => {
    setOpenMenuKey(null);
    if (!onRemove) return;
    try {
      await onRemove(room);
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || "요청 실패";
      console.error("[TravelRoomsTable] remove error:", status, e?.response?.data || e);
      alert(`삭제에 실패했어요. (status: ${status ?? "?"}) ${msg}`);
    }
  };

  const toggleMenu = (e, rowKey) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (openMenuKey === rowKey) {
      setOpenMenuKey(null);
      return;
    }

    // 더보기 버튼의 위치 계산
    const buttonRect = e.currentTarget.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // 화면 하단에 가까우면 위쪽에 표시
    const showAbove = buttonRect.bottom > viewportHeight - 150;
    
    setMenuPosition({
      top: showAbove ? buttonRect.top - 80 : buttonRect.bottom + 4,
      right: window.innerWidth - buttonRect.right,
    });
    
    setOpenMenuKey(rowKey);
  };

  const canView = Boolean(onViewSchedule);

  return (
    <>
      <div className="room-item travel-table">
        <div className="travel-table-head head-shift">
          <div>제목</div>
          <div>지역</div>
          <div>기간</div>
          <div>멤버</div>
          <div className="head-actions" aria-hidden />
        </div>

        <ul className="travel-table-body">
          {hasData ? (
            rows.map((row) => {
              const ended = isEnded(row.raw?.endDate);
              return (
                <li className="travel-row" key={row.key}>
                  <div className="col col-title">{row.title}</div>
                  <div className="col col-region">{row.region}</div>
                  <div className="col col-period">{row.period}</div>
                  <div className="col col-status">{row.memberCount}</div>

                  <div className="col col-actions" onClick={(e) => e.stopPropagation()}>
                    <div className="action-group">
                      {ended ? (
                        <button
                          type="button"
                          className="row-btn btn-enter"
                          onClick={() => handleReview(row.raw)}
                          title="리뷰쓰기"
                        >
                          리뷰쓰기
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="row-btn btn-enter"
                          onClick={() => handleEnter(row.raw)}
                          title="입장하기"
                        >
                          입장하기
                        </button>
                      )}

                      <button
                        type="button"
                        className="row-btn btn-schedule"
                        onClick={canView ? () => handleView(row.raw) : undefined}
                        disabled={!canView}
                        aria-disabled={!canView}
                        title={canView ? "일정 조회" : "일정 조회 기능이 제공되지 않습니다"}
                      >
                        일정 조회
                      </button>
                    </div>

                    <div className="more-wrap">
                      <button
                        type="button"
                        className="row-more"
                        aria-haspopup="menu"
                        aria-expanded={openMenuKey === row.key}
                        onClick={(e) => toggleMenu(e, row.key)}
                        title="더보기"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                          <circle cx="12" cy="5" r="2" />
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="12" cy="19" r="2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              );
            })
          ) : (
            <li className="travel-empty">
              <img
                className="empty-illust"
                src={durumiImg}
                alt="두루미 일러스트"
                loading="lazy"
                draggable="false"
              />
              <p className="empty-text">여행을 시작해보세요.</p>
            </li>
          )}
        </ul>
      </div>

      {/* 🎯 포털 메뉴 - 최상위에 표시! */}
      {openMenuKey && (
        <div 
          role="menu" 
          className="more-menu-portal"
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            right: `${menuPosition.right}px`,
            zIndex: 9999999,
            background: '#ffffff',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            padding: '6px',
            minWidth: '120px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            fontFamily: 'Ownglyph_meetme-Rg, Noto Sans KR, Arial, sans-serif',
          }}
        >
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              const room = rows.find(r => r.key === openMenuKey)?.raw;
              if (room) handleLeave(room);
            }}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: '#ff0000 ',
              padding: '8px 12px',
              textAlign: 'left',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'block',
              fontWeight: '400',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#fee2e2'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            나가기
          </button>

          {onRemove && (
            <button
              role="menuitem"
              type="button"
              onClick={() => {
                const room = rows.find(r => r.key === openMenuKey)?.raw;
                if (room) handleRemove(room);
              }}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: '#ff0000 ',
                padding: '8px 12px',
                textAlign: 'left',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'block',
                fontWeight: '400',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#fee2e2'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              삭제하기
            </button>
          )}
        </div>
      )}
    </>
  );
}