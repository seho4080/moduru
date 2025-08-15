import React, { useRef, useState } from "react";
import { BiChevronLeft } from "react-icons/bi";
import { useDispatch, useSelector } from "react-redux";

import PlaceSearchPanel from "../../features/placeSearch/ui/PlaceSearchPanel";
import SharedPlacePanel from "../../features/sharedPlace/ui/SharedPlacePanel";
import SchedulePanel from "../../features/travelSchedule/ui/SchedulePanel";
import ItineraryInlinePanel from "../../features/tripPlan/ui/ItineraryInlinePanel";

import {
  closeItineraryPanel,
  selectIsItineraryOpen,
} from "../../redux/slices/uiSlice";

/** 리사이즈 가능한 개별 패널 */
function ResizablePanel({
  children,
  defaultWidth = 320,
  minWidth = 240,
  maxWidth = 640,
}) {
  const panelRef = useRef(null);
  const [width, setWidth] = useState(defaultWidth);
  const isResizing = useRef(false);

  const handleMouseDown = () => {
    isResizing.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isResizing.current) return;
    const left = panelRef.current.getBoundingClientRect().left;
    const newWidth = e.clientX - left;
    setWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      ref={panelRef}
      style={{
        width: `${width}px`,
        height: "100%",
        backgroundColor: "white",
        boxShadow: "4px 0 8px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ flex: 1, overflow: "auto" }}>{children}</div>
      {/* 리사이저 */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          width: "6px",
          cursor: "col-resize",
          backgroundColor: "#ddd",
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
        }}
      />
    </div>
  );
}

export default function SidebarPanel({
  activeTab,
  isOpen,
  onClosePanel,
  setActiveTab, // 버튼 active 유지 제어
  setHoveredCoords,
  roomId,
}) {
  const dispatch = useDispatch();
  const isItineraryOpen = useSelector(selectIsItineraryOpen);

  const isPanelVisible =
    isOpen && ["place", "schedule", "shared"].includes(activeTab);

  if (!isPanelVisible) return null;

  const handleClosePanel = () => {
    onClosePanel();
    setActiveTab?.(null); // 패널 닫힐 때 active 해제
  };

  // 공유장소 탭
  if (activeTab === "shared") {
    return (
      <div style={{ display: "flex", height: "100vh", position: "relative" }}>
        {/* 왼쪽: 공유장소 패널 — 항상 고정폭 280px */}
        <div
          style={{
            width: "280px",
            height: "100%",
            backgroundColor: "white",
            boxShadow: "4px 0 8px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <SharedPlacePanel roomId={roomId} />
        </div>

        {/* 오른쪽: 일정 패널 — 열려 있을 때만 표시 + 리사이즈 가능 */}
        {isItineraryOpen && (
          <ResizablePanel defaultWidth={380} minWidth={300} maxWidth={720}>
            <ItineraryInlinePanel
              onClose={() => dispatch(closeItineraryPanel())}
            />
          </ResizablePanel>
        )}

        {/* 닫기 버튼 */}
        <CloseButton
          onClick={() => {
            if (isItineraryOpen) {
              dispatch(closeItineraryPanel());
            } else {
              handleClosePanel();
            }
          }}
        />
      </div>
    );
  }

  // 장소검색 탭
  if (activeTab === "place") {
    return (
      <div style={{ display: "flex", height: "100vh", position: "relative" }}>
        <ResizablePanel defaultWidth={420} minWidth={320} maxWidth={800}>
          <PlaceSearchPanel
            roomId={roomId}
            setHoveredCoords={setHoveredCoords}
          />
        </ResizablePanel>

        <CloseButton onClick={handleClosePanel} />
      </div>
    );
  }

  // 일정편집 탭
  if (activeTab === "schedule") {
    return (
      <div style={{ display: "flex", height: "100vh", position: "relative" }}>
        <ResizablePanel defaultWidth={480} minWidth={360} maxWidth={820}>
          <SchedulePanel />
        </ResizablePanel>

        <CloseButton onClick={handleClosePanel} />
      </div>
    );
  }

  return null;
}

/** 패널 오른쪽 끝 닫기 버튼 */
function CloseButton({ onClick }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute",
        top: "50%",
        right: "0",
        transform: "translate(100%, -50%)",
        width: "28px",
        height: "28px",
        borderRadius: "4px",
        backgroundColor: hovered ? "#eee" : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: hovered ? "pointer" : "default",
        opacity: hovered ? 1 : 0.4,
        boxShadow: hovered ? "0 1px 4px rgba(0,0,0,0.2)" : "none",
        border: "none",
        zIndex: 1000,
        transition: "all 0.2s ease",
      }}
      aria-label="패널 닫기"
      title="패널 닫기"
    >
      <BiChevronLeft size={20} />
    </button>
  );
}
