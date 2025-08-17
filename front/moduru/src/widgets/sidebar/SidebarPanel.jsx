// src/components/SidebarPanel.jsx
import React, { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import PlaceSearchPanel from "../../features/placeSearch/ui/PlaceSearchPanel";
import SharedPlacePanel from "../../features/sharedPlace/ui/SharedPlacePanel";
import ItineraryEditorView from "../../features/tripPlan/ui/ItineraryEditorView"; // 🔸 직접 사용

import {
  closeItineraryPanel,
  openItineraryModal,
  selectIsItineraryOpen,
} from "../../redux/slices/uiSlice";

/** 기본 리사이즈 가능한 패널: 끝 버튼(클릭=닫기, 드래그=리사이즈) */
function ResizablePanel({
  children,
  defaultWidth = 320,
  minWidth = 240,
  maxWidth = 640,
  onClose, // 🔸 클릭 시 닫기 동작
  onWidthChange, // 🔸 크기 변경 콜백 추가
  onResizeStateChange, // 🔸 리사이즈 상태 변경 콜백 추가
}) {
  const panelRef = useRef(null);
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);

  // 🔸 크기 변경시 외부 콜백 호출
  const updateWidth = (newWidth) => {
    setWidth(newWidth);
    onWidthChange?.(newWidth);
  };

  // 🔸 리사이즈 상태 변경시 외부 콜백 호출
  const updateResizeState = (resizing) => {
    setIsResizing(resizing);
    onResizeStateChange?.(resizing);
  };

  // 기존 중앙 핸들 로직 (보조 핸들 유지하고 싶으면 사용)
  const innerIsResizing = useRef(false);
  const handleMouseDownInner = () => {
    innerIsResizing.current = true;
    updateResizeState(true);
    document.addEventListener("mousemove", handleMouseMoveInner);
    document.addEventListener("mouseup", handleMouseUpInner);
  };
  const handleMouseMoveInner = (e) => {
    if (!innerIsResizing.current) return;
    const left = panelRef.current.getBoundingClientRect().left;
    const newWidth = e.clientX - left;
    updateWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
  };
  const handleMouseUpInner = () => {
    innerIsResizing.current = false;
    updateResizeState(false);
    document.removeEventListener("mousemove", handleMouseMoveInner);
    document.removeEventListener("mouseup", handleMouseUpInner);
  };

  // 🔸 끝 버튼: 클릭=닫기, 드래그=리사이즈
  const handleEdgeMouseDown = (e) => {
    const startX = e.clientX;
    const startWidth = width;
    let moved = false;
    const MOVE_THRESHOLD = 6; // 클릭/드래그 구분 임계값(px)

    const onMove = (me) => {
      const dx = Math.abs(me.clientX - startX);
      if (dx >= MOVE_THRESHOLD) moved = true;
      updateResizeState(true);
      const left = panelRef.current.getBoundingClientRect().left;
      const newWidth = me.clientX - left;
      updateWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      updateResizeState(false);
      // 드래그가 아니면 클릭으로 판단 → 닫기
      if (!moved && typeof onClose === "function") onClose();
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  return (
    <div
      ref={panelRef}
      style={{
        width: `${width}px`,
        height: "100vh",
        backgroundColor: "white",
        boxShadow: "4px 0 8px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ flex: 1, overflow: "auto" }}>{children}</div>

      {/* 보조 리사이저 핸들(가운데). 필요 없으면 이 블록을 삭제해도 됨 */}
      <div
        onMouseDown={handleMouseDownInner}
        style={{
          width: "8px",
          height: "40px",
          backgroundColor: "#e5e7eb",
          cursor: "col-resize",
          borderRadius: "4px",
          position: "absolute",
          right: "-4px",
          top: "50%",
          transform: "translateY(-50%)",
          transition: "all 0.2s ease",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}
        title="패널 크기 조절"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: "2px",
                height: "2px",
                backgroundColor: "#9ca3af",
                borderRadius: "50%",
              }}
            />
          ))}
        </div>
      </div>

      {/* 🔸 끝 버튼(클릭=닫기 / 드래그=리사이즈) */}
      <button
        type="button"
        onMouseDown={handleEdgeMouseDown}
        style={{
          position: "absolute",
          top: "50%",
          right: "0",
          transform: "translate(100%, -50%)",
          width: "32px",
          height: "48px",
          borderRadius: "0 12px 12px 0",
          backgroundColor: isResizing ? "#fee2e2" : "white",
          color: isResizing ? "#b91c1c" : "#6b7280",
          border: `1px solid ${isResizing ? "#fecaca" : "#e5e7eb"}`,
          cursor: "col-resize",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: isResizing
            ? "0 4px 12px rgba(185, 28, 28, 0.2)"
            : "0 4px 8px rgba(0, 0, 0, 0.1)",
          transition: "all 0.15s ease",
          zIndex: 12,
          gap: "2px",
          userSelect: "none",
        }}
        title="클릭: 닫기 · 드래그: 크기 조절"
        aria-label="패널 닫기 또는 크기 조절"
      >
        {/* X 아이콘 */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
        {/* 그립 패턴(시각적 힌트) */}
        <div style={{ display: "flex", gap: "2px", marginTop: "2px" }}>
          <div
            style={{
              width: 2,
              height: 8,
              background: "currentColor",
              borderRadius: 1,
            }}
          />
          <div
            style={{
              width: 2,
              height: 8,
              background: "currentColor",
              borderRadius: 1,
            }}
          />
        </div>
      </button>

      {/* 드래그 중 오버레이(선택 방지 & 커서 고정) */}
      {isResizing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            cursor: "col-resize",
            zIndex: 11,
            backgroundColor: "rgba(239, 68, 68, 0.04)",
            userSelect: "none",
          }}
        />
      )}
    </div>
  );
}

/** 공유작업 전용 패널 (오른쪽 일정패널 열기 버튼은 유지) */
function SharedPlaceResizablePanel({ children, roomId }) {
  const dispatch = useDispatch();
  const panelRef = useRef(null);
  const [width, setWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isItineraryOpen = useSelector(selectIsItineraryOpen);
  const trip = useSelector((s) => s.tripRoom);
  const hasDates = !!(trip?.startDate && trip?.endDate);

  const daysMap = useSelector((s) => s.itinerary?.days || {});
  const totalPlaces = Object.values(daysMap).reduce(
    (sum, arr) => sum + (arr?.length || 0),
    0
  );
  const totalDays = Object.keys(daysMap).length;

  const minWidth = 280;
  const maxWidth = 520;

  const handleOpenItinerary = () => {
    if (!roomId) return;
    dispatch(openItineraryModal());
  };

  return (
    <div
      ref={panelRef}
      style={{
        width: `${width}px`,
        height: "100vh",
        backgroundColor: "white",
        boxShadow: "4px 0 8px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ flex: 1, overflow: "auto" }}>{children}</div>

      {/* 일정표 열기 + 리사이즈 핸들 (클릭: 열기, 드래그: 리사이즈) */}
      {!isItineraryOpen && (
        <button
          className="itinerary-button"
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startWidth = width;
            let hasMoved = false;

            const handleMouseMove = (moveEvent) => {
              hasMoved = true;
              const deltaX = moveEvent.clientX - startX;
              const newWidth = Math.max(
                minWidth,
                Math.min(maxWidth, startWidth + deltaX)
              );
              setWidth(newWidth);
              setIsResizing(true);
            };

            const handleMouseUp = () => {
              setIsResizing(false);
              document.removeEventListener("mousemove", handleMouseMove);
              document.removeEventListener("mouseup", handleMouseUp);
              if (!hasMoved) handleOpenItinerary();
            };

            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          disabled={!roomId}
          style={{
            position: "absolute",
            top: "40%",
            right: "-3px",
            transform: "translateY(-50%)",
            width: "32px",
            height: "48px",
            borderRadius: "0 12px 12px 0",
            backgroundColor: isResizing
              ? "#e0e7ff"
              : roomId
              ? isHovered
                ? "#f3f4f6"
                : "white"
              : "#f9fafb",
            color: isResizing ? "#4338ca" : roomId ? "#6b7280" : "#d1d5db",
            border: `1px solid ${isResizing ? "#a5b4fc" : "#e5e7eb"}`,
            cursor: isResizing
              ? "col-resize"
              : roomId
              ? "pointer"
              : "not-allowed",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: isResizing
              ? "0 4px 12px rgba(79, 70, 229, 0.2)"
              : "0 4px 8px rgba(0, 0, 0, 0.1)",
            transition: isResizing ? "none" : "all 0.2s ease",
            opacity: roomId ? 1 : 0.6,
            zIndex: 20,
            gap: "2px",
            userSelect: "none",
          }}
          title={
            isResizing
              ? "드래그하여 크기 조절"
              : !roomId
              ? "여행방 정보가 없습니다"
              : !hasDates
              ? "여행 날짜 미설정 시 설정 화면이 열립니다"
              : totalPlaces > 0
              ? `클릭: 일정표 열기 | 드래그: 크기조절 (${totalDays}일 · ${totalPlaces}곳)`
              : "클릭: 일정표 열기 | 드래그: 크기조절"
          }
        >
          {/* 📅 아이콘 */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ opacity: isResizing ? 0.7 : 1 }}
          >
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
          </svg>
          {/* → 아이콘 */}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
          </svg>

          {totalPlaces > 0 && !isResizing && (
            <div
              style={{
                fontSize: "7px",
                fontWeight: "600",
                backgroundColor: "#f3f4f6",
                color: "#6b7280",
                padding: "1px 3px",
                borderRadius: "4px",
                whiteSpace: "nowrap",
                marginTop: "2px",
              }}
            >
              {totalDays}일·{totalPlaces}곳
            </div>
          )}

          {isResizing && (
            <div
              style={{
                position: "absolute",
                left: "-60px",
                top: "50%",
                transform: "translateY(-50%)",
                backgroundColor: "#4338ca",
                color: "white",
                fontSize: "11px",
                fontWeight: "600",
                padding: "4px 8px",
                borderRadius: "4px",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                boxShadow: "0 2px 8px rgba(67, 56, 202, 0.3)",
              }}
            >
              {width}px
            </div>
          )}
        </button>
      )}

      {/* 아래쪽 리사이즈 핸들 (유지) */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);

          const startX = e.clientX;
          const startWidth = width;

          const handleMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const newWidth = Math.max(
              minWidth,
              Math.min(maxWidth, startWidth + deltaX)
            );
            setWidth(newWidth);
          };

          const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
          };

          document.addEventListener("mousemove", handleMouseMove);
          document.addEventListener("mouseup", handleMouseUp);
        }}
        style={{
          width: "8px",
          height: "40px",
          backgroundColor: isResizing ? "#6366f1" : "#e5e7eb",
          cursor: "col-resize",
          borderRadius: "4px",
          position: "absolute",
          right: "-4px",
          top: "60%",
          transform: "translateY(-50%)",
          transition: "all 0.2s ease",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 15,
        }}
        title="패널 크기 조절"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: "2px",
                height: "2px",
                backgroundColor: isResizing ? "white" : "#9ca3af",
                borderRadius: "50%",
                transition: "background-color 0.2s ease",
              }}
            />
          ))}
        </div>
      </div>

      {isResizing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            cursor: "col-resize",
            zIndex: 9999,
            backgroundColor: "rgba(99, 102, 241, 0.05)",
            userSelect: "none",
          }}
        />
      )}
    </div>
  );
}

/** 메인 SidebarPanel */
export default function SidebarPanel({
  activeTab,
  isOpen,
  onClosePanel,
  setActiveTab,
  setHoveredCoords,
  roomId,
}) {
  const dispatch = useDispatch();
  const isItineraryOpen = useSelector(selectIsItineraryOpen);
  const isPanelVisible = isOpen && ["place", "shared"].includes(activeTab);

  // 🔸 일정 패널 크기 상태 관리 (사실상 사용하지 않지만 호환성을 위해 유지)
  const [itineraryWidth, setItineraryWidth] = useState(500);
  const [isItineraryResizing, setIsItineraryResizing] = useState(false);

  if (!isPanelVisible) return null;

  const handleClosePanel = () => {
    onClosePanel();
    setActiveTab?.(null);
  };

  if (activeTab === "shared") {
    return (
      <div style={{ display: "flex", height: "100vh", position: "relative" }}>
        {/* 왼쪽: 공유작업 패널 */}
        <SharedPlaceResizablePanel roomId={roomId}>
          <SharedPlacePanel roomId={roomId} />
        </SharedPlaceResizablePanel>

        {/* 오른쪽: 일정 패널 (열려있을 때만) */}
        {isItineraryOpen && (
          <ResizablePanel
            defaultWidth={500}
            minWidth={400}
            maxWidth={1000}
            onClose={() => dispatch(closeItineraryPanel())}
            onWidthChange={setItineraryWidth} // 🔸 크기 변경 콜백
            onResizeStateChange={setIsItineraryResizing} // 🔸 리사이즈 상태 콜백
          >
            {/* 🔸 ItineraryEditorView 직접 사용 */}
            <ItineraryEditorView
              onClose={() => dispatch(closeItineraryPanel())}
              hideClose={true} // 외부에서 관리하므로 닫기 버튼 숨김
              lockScroll={false}
            />
          </ResizablePanel>
        )}
      </div>
    );
  }

  if (activeTab === "place") {
    return (
      <div style={{ display: "flex", height: "100vh", position: "relative" }}>
        <ResizablePanel
          defaultWidth={450}
          minWidth={360}
          maxWidth={600}
          onClose={handleClosePanel} // 🔸 클릭=사이드패널 닫기
        >
          <PlaceSearchPanel
            roomId={roomId}
            setHoveredCoords={setHoveredCoords}
          />
        </ResizablePanel>
      </div>
    );
  }

  return null;
}
