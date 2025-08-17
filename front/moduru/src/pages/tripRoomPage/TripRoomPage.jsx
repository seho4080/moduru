/**
 * TripRoomPage
 * - TripRoomProvider로 감싸 상태/사이드 이펙트를 숨긴다.
 * - 이 파일은 UI 배치만 담당하며, 가독성을 높인다.
 */

import React, { useEffect, useState } from "react";
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
import ConfirmPlaceModal from "../../features/customPin/ui/ConfirmPlaceModal";

// NOTE: 서버에서 여행방 메타를 가져오는 API
import { getTripRoomInfo } from "../../features/tripCreate/lib/tripRoomApi";

// NOTE: 지도 중심 이동 (Redux)
import { useDispatch } from "react-redux";
import { setMapCenter } from "../../redux/slices/mapSlice";

// NOTE: 지역 목록 API (위경도 포함)
import { fetchTopRegions, fetchChildRegions } from "../../features/tripCreate/lib/regionApi";

/** 'YYYY-MM-DD'까지 남기기 */
function stripTitleToYmd(s) {
  if (typeof s !== "string") return s ?? "";
  const m = s.match(/\d{4}-\d{2}-\d{2}/);
  if (!m) return s.trim();
  return s.slice(0, s.indexOf(m[0]) + m[0].length).trim();
}

/** 안전한 Date 파서 */
function parseYmd(s) {
  if (!s) return null;
  // YYYY-MM-DD 형식의 문자열을 시간대 무시하고 파싱
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, year, month, day] = match;
    // UTC 기준으로 날짜 생성 (시간대 영향 없음)
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  }
  // 기존 방식으로 fallback
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * NOTE: region 이름 → {lat,lng} 해석 유틸 (이 파일 내부에서만 사용)
 * - 상위(시·도) 먼저, 없으면 하위(시·군·구) 순회
 * - 정확 일치로 매칭
 */
async function resolveRegionCenterByName(name) {
  const key = String(name || "").trim();
  if (!key) return null;

  const tops = await fetchTopRegions();
  const hitTop = tops.find((r) => r?.name === key);
  if (hitTop && Number.isFinite(hitTop.lat) && Number.isFinite(hitTop.lng)) {
    return { lat: Number(hitTop.lat), lng: Number(hitTop.lng) };
  }

  for (const t of tops) {
    const childs = await fetchChildRegions(t.id);
    const hit = childs.find((r) => r?.name === key);
    if (hit && Number.isFinite(hit.lat) && Number.isFinite(hit.lng)) {
      return { lat: Number(hit.lat), lng: Number(hit.lng) };
    }
  }
  return null;
}

/**
 * 실제 화면을 그리는 내부 컴포넌트
 * - useTripRoom()으로 필요한 값만 받아와 배치한다.
 */
function TripRoomView() {
  const dispatch = useDispatch();

  const {
    mapRef,

    meta: {
      travelRoomId,
      title,            // 슬라이스에 있는 현재 제목
      region,           // 전역 region(Provider에서 관리)
      setRegion,
      tripRegion,       // 지도/폼에 사용하는 지역
      setTripRegion,
      tripName,         // 폼에 표시될 제목 상태
      setTripName,
      tripDates,        // [Date|null, Date|null]
      setTripDates,
      showTripModal,
      setShowTripModal,
      activeTab,
      setActiveTab,
      onTabChange,
      onTripSave,
      selectedPlace,
      isRouteModalOpen,
      roomMembers,
      friendList,
      // 슬라이스에서 제공되는 날짜 원본(문자열)
      startDate,        // 'YYYY-MM-DD' | ''
      endDate,          // 'YYYY-MM-DD' | ''
    },

    marker: {
      mode,
      setMode,
      zoomable,
      setZoomable,
      removeMode,
      setRemoveMode,
      handleDeleteConfirm,
      handleMarkerSelect,
      handlePinPlaced,
      confirmData,
      setConfirmData,
      pendingPin,
      setPendingPin,
    },

    setSelectedPlace,
    closeRouteModal,
    handleSharedPlaceCardClick,
  } = useTripRoom();

  // 지역 모달 오픈은 페이지에서 제어
  const [openRegionModal, setOpenRegionModal] = useState(false);

  // 서버 조회 완료 플래그(이게 true여야 자동 오픈 판단)
  const [serverRegionChecked, setServerRegionChecked] = useState(false);

  // 서버에서 받아온 region(자동 오픈 판단 전용)
  const [serverRegion, setServerRegion] = useState("");

  // 저장 인플라이트 플래그(저장 중엔 자동 오픈 금지)
  const [regionSaving, setRegionSaving] = useState(false);

  // roomId가 유효해지면 서버에서 메타를 1회 가져와 region/제목/날짜 확인
  useEffect(() => {
    let alive = true;
    async function load() {
      if (!travelRoomId) return;

      try {
        const data = await getTripRoomInfo(travelRoomId);
        if (!alive) return;

        const srvRegion = (data?.region ?? "").trim();
        const srvTitle  = stripTitleToYmd(data?.title ?? "");
        const srvStart  = (data?.startDate ?? "").trim();
        const srvEnd    = (data?.endDate ?? "").trim();

        setServerRegion(srvRegion);
        setServerRegionChecked(true);

        // region 반영
        if ((!region || String(region).trim() === "") && srvRegion) {
          setRegion(srvRegion);
          setTripRegion(srvRegion);
        }

        // 제목/날짜 반영: 현재 폼 상태가 비어 있을 때만 덮어쓴다
        if ((!tripName || !tripName.trim()) && srvTitle) {
          setTripName(srvTitle);
        }
        const d1 = parseYmd(srvStart);
        const d2 = parseYmd(srvEnd);
        const datesEmpty =
          !Array.isArray(tripDates) ||
          !(tripDates[0] instanceof Date) ||
          !(tripDates[1] instanceof Date);
        if (datesEmpty && d1 && d2) {
          setTripDates([d1, d2]);
        }

        // 자동 오픈: 서버 region이 비어 있고, 저장 중이 아닐 때만
        setOpenRegionModal(srvRegion === "" && !regionSaving);

        // NOTE: 여기서 바로 지도 중심 이동 (srvRegion이 문자열만 있을 수 있으므로 해석)
        if (srvRegion) {
          try {
            const pos = await resolveRegionCenterByName(srvRegion);
            if (alive && pos) dispatch(setMapCenter(pos));
          } catch {}
        }
      } catch (e) {
        // 실패 시에도 체크 완료로 간주하고 모달 오픈(저장 중이면 오픈하지 않음)
        setServerRegion("");
        setServerRegionChecked(true);
        setOpenRegionModal(!regionSaving);
      }
    }
    load();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [travelRoomId]);

  // TripCreateForm 모달 열릴 때, 비어있는 항목만 슬라이스 값으로 보정
  useEffect(() => {
    if (!showTripModal) return;

    // 제목
    if (!tripName || !tripName.trim()) {
      const normalized = stripTitleToYmd(title ?? "");
      if (normalized) setTripName(normalized);
    }

    // 날짜
    const datesEmpty =
      !Array.isArray(tripDates) ||
      !(tripDates[0] instanceof Date) ||
      !(tripDates[1] instanceof Date);

    if (datesEmpty) {
      const d1 = parseYmd(startDate);
      const d2 = parseYmd(endDate);
      if (d1 && d2) setTripDates([d1, d2]);
    }

    // 지역
    if ((!tripRegion || !tripRegion.trim()) && region && region.trim()) {
      setTripRegion(region.trim());
    }
  }, [
    showTripModal,
    title,
    startDate,
    endDate,
    tripName,
    tripDates,
    tripRegion,
    region,
    setTripName,
    setTripDates,
    setTripRegion,
  ]);

  // X 닫기 가드: 지역이 없으면 닫기 불가 (RegionOnlyModal용)
  const handleRegionModalClose = () => {
    const hasRegion = !!(region && String(region).trim() !== "");
    if (!hasRegion) {
      alert("여행지를 선택해 주세요.");
      return;
    }
    setOpenRegionModal(false);
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* 경로 최적화 모달 */}
      {isRouteModalOpen && <RouteModal onClose={closeRouteModal} />}

      {/* 좌측 사이드바 */}
      <SidebarContainer
        activeTab={activeTab}
        onTabChange={(tab) => {
          setSelectedPlace(null);
          onTabChange(tab);
        }}
        roomId={travelRoomId}
        region={region}
        onSharedPlaceCardClick={handleSharedPlaceCardClick}
      />

      {/* 우측 지도/컨트롤 영역 */}
      <div style={{ flex: 1, position: "relative", display: "flex" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <MapHeaderBar
            roomMembers={roomMembers}
            friendList={friendList}
            onExit={() => setActiveTab("exit")}
          />

          <MapSection>
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

            <KakaoMap
              ref={mapRef}
              mode={mode}
              zoomable={zoomable}
              region={tripRegion}
              removeMode={removeMode}
              onSelectMarker={handleMarkerSelect}
              pinCoords={
                selectedPlace
                  ? { lat: selectedPlace.latitude, lng: selectedPlace.longitude }
                  : null
              }
              onPinPlaced={handlePinPlaced}
            />

            {selectedPlace && (
              <PlaceDetailModal place={selectedPlace} roomId={travelRoomId} />
            )}
          </MapSection>

          {/* 지역 설정 모달: 서버 region이 비어 있을 때만 자동 오픈, X로는 닫히지 않음 */}
          {serverRegionChecked && openRegionModal && (
            <RegionOnlyModal
              roomId={travelRoomId}
              title={title}
              currentRegion={region ?? ""}           /* 헤더 표시 및 가드용 */
              onClose={handleRegionModalClose}        /* 지역 없으면 닫기 차단 */
              onSavingChange={setRegionSaving}        /* 저장 인플라이트 반영 */
              onSuccess={async (data) => {
                // 저장된 region 반영
                const newRegion = (data?.region ?? "").trim();
                if (newRegion) {
                  setTripRegion(newRegion);
                  setRegion(newRegion);
                }

                // 1순위: data.lat/lng 있으면 즉시 이동
                const lat = Number(data?.lat);
                const lng = Number(data?.lng);
                if (Number.isFinite(lat) && Number.isFinite(lng)) {
                  dispatch(setMapCenter({ lat, lng }));
                } else if (newRegion) {
                  // 2순위: region 이름으로 좌표 해석 후 이동
                  try {
                    const pos = await resolveRegionCenterByName(newRegion);
                    if (pos) dispatch(setMapCenter(pos));
                  } catch {}
                }

                setOpenRegionModal(false);
              }}
            />
          )}

          {/* 여행 생성/수정 모달 */}
          {showTripModal && (
            <TripCreateForm
              roomId={travelRoomId}
              /* 폼 기본 제목은 최신 값인 tripName을 우선, 없으면 슬라이스 title */
              fallbackTitle={stripTitleToYmd(tripName || title || "")}
              tripName={tripName}
              setTripName={setTripName}
              region={tripRegion}
              setRegion={setTripRegion}
              dates={tripDates}
              setDates={setTripDates}
              onClose={() => setShowTripModal(false)}
              onSuccess={async (data) => {
                // 저장된 최신 메타 즉시 반영
                const newTitle = stripTitleToYmd(data?.title ?? tripName ?? "");
                if (newTitle) setTripName(newTitle);

                const d1 = parseYmd(data?.startDate);
                const d2 = parseYmd(data?.endDate);
                if (d1 && d2) setTripDates([d1, d2]);

                if (data?.region) {
                  const r = String(data.region).trim();
                  if (r) { setTripRegion(r); setRegion(r); }
                }

                // 1순위: 좌표 동봉 시 즉시 이동
                const lat = Number(data?.lat);
                const lng = Number(data?.lng);
                if (Number.isFinite(lat) && Number.isFinite(lng)) {
                  dispatch(setMapCenter({ lat, lng }));
                } else if (data?.region) {
                  // 2순위: 이름으로 좌표 해석 후 이동
                  try {
                    const pos = await resolveRegionCenterByName(String(data.region));
                    if (pos) dispatch(setMapCenter(pos));
                  } catch {}
                }

                onTripSave?.(data); // Provider 측 후처리 훅
              }}
            />
          )}

          {/* 핀 등록 확인 모달 */}
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
              setPendingPin(null);
            }}
          />

          {/* 고정 배치 나가기 버튼 */}
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
