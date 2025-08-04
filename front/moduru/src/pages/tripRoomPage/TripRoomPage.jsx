import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import SidebarContainer from '../../widgets/sidebar/SidebarContainer';
import Controls from '../../features/map/ui/MapControls';
import KakaoMap from '../../features/map/ui/KakaoMap';
import TripCreateForm from '../../features/tripCreate/ui/TripCreateForm';
import RegionOnlyModal from '../../features/tripCreate/ui/RegionOnlyModal';
import InviteButton from '../../features/invite/ui/InviteButton';
import TestAddPin from "../../features/map/dev/TestAddPin";

export default function TripRoomPage() {
  const location = useLocation();

  const {
    travelRoomId,
    title,
    region: initialRegion,
    startDate,
    endDate,
    createdAt,
  } = location.state || {};

  const [mode, setMode] = useState("marker");
  const [zoomable, setZoomable] = useState(true);
  const [region, setRegion] = useState("");
  const [removeMode, setRemoveMode] = useState(false);
  const [toRemove, setToRemove] = useState(new Set());

  const [activeTab, setActiveTab] = useState(null);
  const [showTripModal, setShowTripModal] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(!initialRegion);

  const [tripName, setTripName] = useState("");
  const [tripRegion, setTripRegion] = useState("");
  const [tripDates, setTripDates] = useState([null, null]);
  const [hoveredCoords, setHoveredCoords] = useState(null);

  const mapRef = useRef();

  // NOTE: 여행방 제목/지역/날짜 정보를 최초 렌더링 시 상태에 반영
  useEffect(() => {
    if (title) setTripName(title);
    if (initialRegion) setTripRegion(initialRegion);
    if (startDate && endDate) setTripDates([new Date(startDate), new Date(endDate)]);
  }, [title, initialRegion, startDate, endDate]);

  // NOTE: 삭제 확정 시, 선택된 마커들을 지도에서 제거하고 상태 초기화
  const handleDeleteConfirm = () => {
    if (toRemove.size === 0) {
      alert("삭제할 핀을 먼저 선택하세요.");
      return;
    }

    if (window.confirm("삭제하시겠습니까?")) {
      toRemove.forEach((mk) => mk.setMap(null));
      setToRemove(new Set());
      setRemoveMode(false);
      setMode("marker");
    }
  };

  // NOTE: 선택된 마커 목록을 외부에서 전달받아 상태로 저장
  const onSelectMarker = useCallback((selSet) => {
    setToRemove(new Set(selSet));
  }, []);

  // NOTE: 사이드바 탭 클릭 시 활성 탭 변경 또는 모달 표시
  const handleTabChange = (tab) => {
    if (tab === "openTripModal") {
      setShowTripModal(true);
    } else if (tab === "exit") {
      console.log("나가기");
    } else {
      setActiveTab(tab);
    }
  };

  // NOTE: 여행 정보 저장 (임시 로그 처리)
  const handleTripSave = () => {
    console.log("[여행방 정보]", {
      travelRoomId,
      tripName,
      tripRegion,
      tripDates,
    });

    setShowTripModal(false);
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <SidebarContainer
        activeTab={activeTab}
        onTabChange={handleTabChange}
        roomId={travelRoomId}
        setHoveredCoords={setHoveredCoords}
      />

      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 1000 }}>
          <InviteButton onClick={() => alert('초대 링크 복사')} />
        </div>

        <Controls
          mode={mode}
          setMode={setMode}
          zoomable={zoomable}
          setZoomable={setZoomable}
          zoomIn={() => mapRef.current?.zoomIn?.()}
          zoomOut={() => mapRef.current?.zoomOut?.()}
          region={region}
          setRegion={setRegion}
          removeMode={removeMode}
          setRemoveMode={setRemoveMode}
          onDeleteConfirm={handleDeleteConfirm}
        />

        <TestAddPin roomId={travelRoomId} />

        <KakaoMap
          ref={mapRef}
          mode={mode}
          zoomable={zoomable}
          region={tripRegion}
          removeMode={removeMode}
          onSelectMarker={onSelectMarker}
          hoveredCoords={hoveredCoords}
        />

        {showRegionModal && (
          <RegionOnlyModal
            roomId={travelRoomId}
            onRegionSet={(region) => {
              setTripRegion(region);
              setShowRegionModal(false);
            }}
          />
        )}

        {showTripModal && (
          <TripCreateForm
            tripName={tripName}
            setTripName={setTripName}
            region={tripRegion}
            setRegion={setTripRegion}
            dates={tripDates}
            setDates={setTripDates}
            onClose={() => setShowTripModal(false)}
            onSubmit={handleTripSave}
          />
        )}

        <button
          onClick={() => setActiveTab("exit")}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            zIndex: 1000,
            backgroundColor: "#ffffff",
            color: "#007aff",
            fontWeight: "bold",
            border: "none",
            borderRadius: "8px",
            padding: "10px 16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            cursor: "pointer",
            transition: "background 0.2s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#f0f7ff";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "#ffffff";
          }}
        >
          나가기
        </button>
      </div>
    </div>
  );
}
