/**
 * TripRoomProvider
 * - TripRoom 페이지에서 사용하는 모든 상태와 사이드 이펙트를 캡슐화한다.
 * - 페이지 컴포넌트는 UI 배치만 담당하고, 데이터 접근은 useTripRoom()로 한정한다.
 */

import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { useLocation, useSearchParams, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";

// Redux 액션
import { setSelectedPlace, setMapCenter, setSelectedPinId } from "../../redux/slices/mapSlice";
import { closeRouteModal } from "../../redux/slices/uiSlice";
import { setTripRoom } from "../../redux/slices/tripRoomSlice";

// 내부 훅
import { useTripRoomMeta } from "./hooks/useTripRoomMeta";
import { useMapMarkerFlow } from "./hooks/useMapMarkerFlow";

// 공유 장소 목록/소켓 구독 훅
import useSharedPlaceList from "../../features/sharedPlace/model/useSharedPlaceList";
import useSharedPlaceSocket from "../../features/sharedPlace/model/useSharedPlaceSocket";

// 유틸: 지역명 → 위경도 변환
import { getLatLngFromRegion } from "../../features/map/lib/regionUtils";

const TripRoomContext = createContext(null);

export default function TripRoomProvider({ children }) {
  // 라우팅 관련 객체들
  const location = useLocation(); // 현재 라우트의 위치 객체
  const [searchParams] = useSearchParams(); // URL 쿼리 파라미터
  const { id: roomIdFromParam } = useParams(); // 경로 파라미터의 roomId
  const dispatch = useDispatch(); // Redux 디스패치

  // 페이지 진입 시 history.push/Link 등으로 전달된 초기 상태
  const initialState = location.state || null;

  // KakaoMap 인스턴스에 접근하기 위한 ref
  const mapRef = useRef(null);

  // 여행방 메타/모달/탭 상태 관리 훅
  const meta = useTripRoomMeta({
    roomIdFromParam,
    location,
    searchParams,
    initialState,
    mapRef,
  });

  // 지도 상호작용(모드 전환, 핀 배치, 삭제 등) 상태 관리 훅
  const marker = useMapMarkerFlow({ mapRef, travelRoomId: meta.travelRoomId });

  // 현재 방 ID 기준으로 공유 장소 목록 로딩
  useSharedPlaceList(meta.travelRoomId);

  // 현재 방 ID 기준으로 공유 장소 소켓 구독
  useSharedPlaceSocket(meta.travelRoomId);

  // Redux 동기화: 화면 메타 상태를 전역 store에 반영
  useEffect(() => {
    const {
      travelRoomId,
      tripName,
      title,
      tripRegion,
      region,
      tripDates,
      startDate,
      endDate,
    } = meta;

    if (!travelRoomId) return;

    // 날짜를 YYYY-MM-DD로 정규화
    const normalize = (d) =>
      d && !isNaN(d) ? new Date(d).toISOString().slice(0, 10) : "";

    dispatch(
      setTripRoom({
        roomId: travelRoomId, // 현재 방 식별자
        title: tripName || title || "", // 제목(우선순위: 수정본 > 초기값)
        region: tripRegion || region || "", // 지역(우선순위: 수정본 > 초기값)
        startDate: startDate || normalize(tripDates?.[0]) || "",
        endDate: endDate || normalize(tripDates?.[1]) || "",
      })
    );
  }, [
    dispatch,
    meta.travelRoomId,
    meta.tripName,
    meta.title,
    meta.tripRegion,
    meta.region,
    meta.tripDates,
    meta.startDate,
    meta.endDate,
  ]);

  // 지역 문자열이 바뀔 때 지도 중심을 해당 지역 좌표로 이동
  useEffect(() => {
    const currentRegion = meta.tripRegion || meta.region;
    if (!currentRegion) return;

    const coords = getLatLngFromRegion(currentRegion); // { lat, lng } 형태
    if (coords && mapRef.current?.setCenter) {
      mapRef.current.setCenter(coords); // KakaoMap에서 제공하는 중심 이동 메서드
    }
  }, [meta.tripRegion, meta.region]);

  // 카드 클릭 시 핀 포커스 핸들러
  const handleSharedPlaceCardClick = (place) => {
    console.log('handleSharedPlaceCardClick called with:', place);
    if (!place) return;
    
    const lat = Number(place?.lat ?? place?.latitude ?? place?.y);
    const lng = Number(place?.lng ?? place?.longitude ?? place?.x);
    
    console.log('Coordinates:', { lat, lng });
    
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      // 지도 중심을 해당 위치로 이동
      dispatch(setMapCenter({ lat, lng }));
      
      // 선택된 핀 ID 설정 (색깔 변경용)
      const pinId = place.wantId || place.id;
      if (pinId) {
        dispatch(setSelectedPinId(pinId));
      }
    }
  };

  // 컨텍스트로 노출할 값 구성
  const value = useMemo(
    () => ({
      mapRef, // 지도 인스턴스 접근 ref
      meta, // 여행방 메타/모달/탭 상태
      marker, // 지도 상호작용 상태
      dispatch, // 필요 시 외부에서 디스패치 사용
      setSelectedPlace: (p) => dispatch(setSelectedPlace(p)), // 선택 장소 변경 헬퍼
      closeRouteModal: () => dispatch(closeRouteModal()), // 경로 모달 닫기 헬퍼
      handleSharedPlaceCardClick, // 공유 장소 카드 클릭 핸들러
    }),
    [dispatch, meta, marker, handleSharedPlaceCardClick]
  );

  return (
    <TripRoomContext.Provider value={value}>
      {children}
    </TripRoomContext.Provider>
  );
}

/**
 * TripRoom 컨텍스트 접근 훅
 * - Provider 외부에서 호출 시 오류를 발생시켜 오용을 방지한다.
 */
export function useTripRoom() {
  const ctx = useContext(TripRoomContext);
  if (!ctx) throw new Error("useTripRoom must be used within TripRoomProvider");
  return ctx;
}
