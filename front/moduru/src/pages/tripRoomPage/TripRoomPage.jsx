/**
 * TripRoomPage
 * - TripRoomProvider로 감싸 상태/사이드 이펙트를 숨긴다.
 * - 이 파일은 UI 배치만 담당하며, 가독성을 높인다.
 */

import React from "react";
import TripRoomProvider, { useTripRoom } from "./TripRoomProvider";

// 레이아웃 구성 요소
import { MapHeaderBar, MapSection } from "./index";

// 기능 컴포넌트
import SidebarContainer from "../../widgets/sidebar/SidebarContainer";
import Controls from "../../features/map/ui/MapControls";
import KakaoMap from "../../features/map/ui/KakaoMap";
import TripCreateForm from "../../features/tripCreate/ui/TripCreateForm";
import RegionOnlyModal from "../../features/tripCreate/ui/RegionOnlyModal";
import PlaceDetailModal from "../../features/placeDetail/ui/PlaceDetailModal";
import RouteModal from "../../features/tripPlanOptimize/ui/RouteModal";
import ConfirmPlaceModal from "../../features/map/ui/ConfirmPlaceModal";

/**
 * 실제 화면을 그리는 내부 컴포넌트
 * - useTripRoom()으로 필요한 값만 받아와 배치한다.
 */
function TripRoomView() {
  // Provider에서 공급되는 모든 상태/함수
  const {
    mapRef, // KakaoMap 제어용 ref

    // 여행방 메타/모달/탭 상태 모음
    meta: {
      travelRoomId, // 방 ID
      title, // 제목
      region, // 지역(원본)
      setRegion, // 지역 설정 함수(Controls에 전달)
      tripRegion, // 지역(수정본)
      setTripRegion,
      tripName,
      setTripName,
      tripDates,
      setTripDates,
      showRegionModal,
      setShowRegionModal,
      showTripModal,
      setShowTripModal,
      activeTab,
      setActiveTab,
      onTabChange, // 탭 변경 시의 추가 처리
      onTripSave, // 여행 정보 저장 처리
      selectedPlace,
      isRouteModalOpen,
      roomMembers,
      friendList,
    },

    // 지도 상호작용 상태/콜백 모음
    marker: {
      mode, // 지도 모드("", "measure", "pin" 등)
      setMode,
      zoomable, // 확대/축소 가능 여부
      setZoomable,
      removeMode, // 삭제 모드
      setRemoveMode,
      handleDeleteConfirm,
      handleMarkerSelect,
      handlePinPlaced,
      confirmData, // 핀 등록 모달 데이터
      setConfirmData,
      pendingPin, // 등록 대기 핀
      setPendingPin,
    },

    // 헬퍼 액션
    setSelectedPlace, // 선택 장소 초기화/설정
    closeRouteModal, // 경로 모달 닫기
  } = useTripRoom();

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* 경로 최적화 모달 */}
      {isRouteModalOpen && <RouteModal onClose={closeRouteModal} />}

      {/* 좌측 사이드바: 탭 전환 시 선택 장소를 초기화한다. */}
      <SidebarContainer
        activeTab={activeTab}
        onTabChange={(tab) => {
          setSelectedPlace(null);
          onTabChange(tab);
        }}
        roomId={travelRoomId}
        region={region}
      />

      {/* 우측 지도/컨트롤 영역 */}
      <div style={{ flex: 1, position: "relative", display: "flex" }}>
        <div style={{ flex: 1, position: "relative" }}>
          {/* 상단 유틸 바: 초대/나가기 등 */}
          <MapHeaderBar
            roomMembers={roomMembers}
            friendList={friendList}
            onExit={() => setActiveTab("exit")}
          />

          <MapSection>
            {/* 지도 컨트롤러: 모드 전환, 줌 컨트롤, 지역 설정 */}
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

            {/* 카카오 지도: 선택/핀 배치 콜백을 전달한다. */}
            <KakaoMap
              ref={mapRef}
              mode={mode}
              zoomable={zoomable}
              region={tripRegion}
              removeMode={removeMode}
              onSelectMarker={handleMarkerSelect}
              pinCoords={
                selectedPlace
                  ? {
                      lat: selectedPlace.latitude,
                      lng: selectedPlace.longitude,
                    }
                  : null
              }
              onPinPlaced={handlePinPlaced}
            />

            {/* 선택된 장소 상세 모달 */}
            {selectedPlace && <PlaceDetailModal place={selectedPlace} />}
          </MapSection>

          {/* 지역 설정 모달: 저장 성공 시 지역 상태를 갱신한다. */}
          {showRegionModal && (
            <RegionOnlyModal
              roomId={travelRoomId}
              title={title}
              onClose={() => setShowRegionModal(false)}
              onSuccess={(data) => {
                const newRegion = data?.region ?? null;
                if (newRegion) {
                  setTripRegion(newRegion);
                  setRegion(newRegion);
                  // 지도 중심 이동은 Provider의 useEffect가 담당
                }
              }}
            />
          )}

          {/* 여행 생성/수정 모달 */}
          {showTripModal && (
            <TripCreateForm
              roomId={travelRoomId}
              tripName={tripName}
              setTripName={setTripName}
              region={tripRegion}
              setRegion={setTripRegion}
              dates={tripDates}
              setDates={setTripDates}
              onClose={() => setShowTripModal(false)}
              onSubmit={onTripSave}
            />
          )}

          {/* 핀 등록 확인 모달: 반려 시 임시 마커 제거 */}
          <ConfirmPlaceModal
            open={confirmData.open}
            roomId={travelRoomId}
            name={confirmData.name}
            lat={confirmData.lat}
            lng={confirmData.lng}
            address={confirmData.address}
            onClose={() => setConfirmData((p) => ({ ...p, open: false }))}
            onReject={() => {
              pendingPin?.marker?.setMap(null);
              setPendingPin(null);
              setMode("");
            }}
            onSuccess={() => {
              // 성공 시 임시 상태 초기화
              setPendingPin(null);
            }}
          />

          {/* 고정 배치 나가기 버튼: 탭을 exit로 전환 */}
          <button
            onClick={() => setActiveTab("exit")}
            style={{
              position: "fixed",
              bottom: 20,
              right: 20,
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
            onMouseOver={(e) => (e.currentTarget.style.background = "#f0f7ff")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#ffffff")}
          >
            나가기
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 라우트 엔트리 컴포넌트
 * - 상태 공급을 위해 Provider로 감싼다.
 */
export default function TripRoomPage() {
  return (
    <TripRoomProvider>
      <TripRoomView />
    </TripRoomProvider>
  );
}
