// ✅ src/pages/TripRoomPage.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import SidebarContainer from '../../widgets/sidebar/SidebarContainer';
import Controls from '../../features/map/ui/MapControls';
import KakaoMap from '../../features/map/ui/KakaoMap';
import TripCreateForm from '../../features/tripCreate/ui/TripCreateForm';
import RegionOnlyModal from '../../features/tripCreate/ui/RegionOnlyModal';
import InviteButton from '../../features/invite/ui/InviteButton';
import TestAddPin from "../../features/map/dev/TestAddPin";
//import FakeAutoPin from '../../features/map/dev/FakeAutoPin';

/**
 * 여행방 상세 페이지 컴포넌트
 * - 사이드바 + 지도 + 모달 조합
 * - roomId를 통해 실시간 핀 공유, 정보 관리
 */
export default function TripRoomPage() {
  // 라우터에서 전달된 여행방 정보 추출
  const location = useLocation();

  // ✅ 전체 travelRoom 정보 받기
  const {
    travelRoomId,
    title,
    region: initialRegion,
    startDate,
    endDate,
    createdAt,
  } = location.state || {};

  // 지도 제어 상태
  const [mode, setMode] = useState("marker");
  const [zoomable, setZoomable] = useState(true);
  const [region, setRegion] = useState("");
  const [removeMode, setRemoveMode] = useState(false);
  const [toRemove, setToRemove] = useState(new Set()); // 삭제 대상 마커 집합

  // 사이드바 탭 상태 및 모달
  const [activeTab, setActiveTab] = useState(null);
  const [showTripModal, setShowTripModal] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(!initialRegion);

  // 여행방 정보 (제목, 지역, 날짜)
  const [tripName, setTripName] = useState("");
  const [tripRegion, setTripRegion] = useState("");
  const [tripDates, setTripDates] = useState([null, null]);
  const [hoveredCoords, setHoveredCoords] = useState(null);

  // KakaoMap 제어용 ref
  const mapRef = useRef();

  // ✅ 초기 데이터 반영
  useEffect(() => {
    if (title) setTripName(title);
    if (initialRegion) setTripRegion(initialRegion);
    if (startDate && endDate) setTripDates([new Date(startDate), new Date(endDate)]);
  }, [title, initialRegion, startDate, endDate]);

  /**
   * 핀 삭제 확정
   * - 선택된 마커를 지도에서 제거
   */
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

  /**
   * 마커 선택 콜백
   * @param {Set} selSet - 선택된 마커들
   */
  const onSelectMarker = useCallback((selSet) => {
    setToRemove(new Set(selSet));
  }, []);

  /**
   * 사이드바 탭 클릭 핸들러
   * @param {string} tab - 클릭된 탭 id
   */
  const handleTabChange = (tab) => {
    if (tab === "openTripModal") {
      setShowTripModal(true);
    } else if (tab === "exit") {
      console.log("나가기");
    } else {
      setActiveTab(tab);
    }
  };

  /**
   * 여행방 정보 저장 (임시)
   */
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
      {/* 좌측 사이드바 */}
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

        {/* 테스트용 핀 추가 버튼 */}
        <TestAddPin roomId={travelRoomId} />

        {/* 자동 핀 배치 테스트용 (비활성화됨) */}
        {/* <FakeAutoPin /> */}

        {/* 카카오 지도 렌더링 */}
        <KakaoMap
          ref={mapRef}
          mode={mode}
          zoomable={zoomable}
          region={tripRegion}
          removeMode={removeMode}
          onSelectMarker={onSelectMarker}
          hoveredCoords={hoveredCoords}
        />

        {/* 지역 선택 모달 (최초 진입 시 필수) */}
        {showRegionModal && (
          <RegionOnlyModal
            roomId={travelRoomId}
            onRegionSet={(region) => {
              setTripRegion(region);
              setShowRegionModal(false);
            }}
          />
        )}

        {/* 여행 정보 저장 모달 */}
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

        {/* 하단 고정 나가기 버튼 */}
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
