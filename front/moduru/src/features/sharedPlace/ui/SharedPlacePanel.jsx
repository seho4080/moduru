// src/features/sharedPlace/ui/SharedPlacePanel.jsx
import { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import SharedPlaceList from "./SharedPlaceList";
import { useRemoveSharedPlace } from "../model/useRemoveSharedPlace";

// 일정표/여행정보 모달
import {
  openItineraryModal,
  openTripForm,
} from "../../../redux/slices/uiSlice";

// ✅ AI 일정 추천
import {
  openAiModal,
  applyAiStarted,
} from "../../../redux/slices/aiScheduleSlice";
import { requestAiSchedule } from "../../aiSchedule/lib/aiScheduleApi";

// ✅ 소켓 구독
import useAiSchedule from "@/features/aiSchedule/model/useAiSchedule";

// ✅ 항상 마운트
import AiScheduleModal from "@/features/aiSchedule/ui/AiScheduleModal";

// ✅ 여행방 API (내 여행방 목록 조회)
import { getUserTravelRooms } from "../../travelSpace/lib/roomApi";

const PANEL_WIDTH = 280; // SidebarPanel의 공유 패널 고정폭과 일치

export default function SharedPlacePanel({ roomId }) {
  const dispatch = useDispatch();
  const { removeSharedPlace } = useRemoveSharedPlace();

  // 🔔 여기서 단 한 번만 소켓 구독됨
  useAiSchedule(roomId);

  // 제목에 총 개수 표시용
  const sharedPlaces = useSelector((s) => s.sharedPlace.sharedPlaces) || [];

  // 여행방(스토어)
  const trip = useSelector((s) => s.tripRoom);

  // 스토어 기준 날짜 유무
  const hasDatesInStore = !!(trip?.startDate && trip?.endDate);

  // 로컬에서도 캐싱(서버 조회 후 true로 전환 가능)
  const [hasDates, setHasDates] = useState(hasDatesInStore);
  const [checkingDates, setCheckingDates] = useState(false);

  useEffect(() => {
    setHasDates(hasDatesInStore);
  }, [hasDatesInStore]);

  // 여행일수 계산
  const travelDays = useMemo(() => {
    if (!trip?.startDate || !trip?.endDate) return 1;
    const s = new Date(trip.startDate);
    const e = new Date(trip.endDate);
    s.setHours(0, 0, 0, 0);
    e.setHours(0, 0, 0, 0);
    return Math.max(1, Math.floor((e - s) / 86400000) + 1);
  }, [trip?.startDate, trip?.endDate]);

  // ✅ 선택 모드 토글 (버튼 눌러야 활성화)
  const [selectMode, setSelectMode] = useState(false);

  // 선택 상태는 패널이 소유(리스트는 Controlled)
  const [selectedWantIds, setSelectedWantIds] = useState([]);

  const minCount = travelDays * 1;
  const maxCount = travelDays * 10;
  const count = selectedWantIds.length;
  const inRange = count >= minCount && count <= maxCount;

  const handleRemove = (place) => {
    if (!place?.wantId) return;
    removeSharedPlace(roomId, place.wantId);
  };

  /**
   * 날짜가 없으면 서버에서 최신 방 정보를 조회해 있는지 확인.
   * 여전히 없으면 여행정보 설정 폼을 열고 false 반환.
   * 날짜가 확보되면 true 반환.
   */
  const ensureTripDates = async () => {
    // 스토어에 이미 있으면 패스
    if (hasDates) return true;

    // roomId가 없으면 더 진행 불가
    if (!roomId) return false;

    setCheckingDates(true);
    try {
      const rooms = await getUserTravelRooms();
      const current =
        rooms?.find(
          (r) =>
            String(r?.id) === String(roomId) ||
            String(r?.roomId) === String(roomId)
        ) || null;

      const start = current?.startDate;
      const end = current?.endDate;

      if (start && end) {
        // 서버에 있으면 로컬 플래그 true로 전환(스토어 동기화는 별도 흐름에서 처리)
        setHasDates(true);
        return true;
      }

      // 서버에도 없으면 날짜 설정 폼 오픈
      dispatch(openTripForm());
      return false;
    } catch (e) {
      // API 실패 시에도 폼 열어 사용자에게 설정 기회 제공
      dispatch(openTripForm());
      return false;
    } finally {
      setCheckingDates(false);
    }
  };

  // 일정표 담기 버튼 클릭
  const handleOpenItinerary = async () => {
    // 날짜 확보 시에만 일정표 오픈
    const ok = await ensureTripDates();
    if (ok) {
      dispatch(openItineraryModal());
    }
  };

  const handleRunAi = async () => {
    if (!roomId || !inRange) return;

    // ✅ 낙관적 STARTED 노출 + 모달 오픈
    dispatch(
      applyAiStarted({
        msg: {
          jobId: null,
          days: travelDays,
          updatedAt: new Date().toISOString(),
        },
      })
    );
    dispatch(openAiModal());

    // ✅ 실제 추천 요청
    try {
      await requestAiSchedule(roomId, selectedWantIds, travelDays);
    } catch (e) {
      console.error("[AI Schedule] request error", e);
    }
  };

  // AI 버튼 클릭 동작
  const handleAiButtonClick = () => {
    // 선택 모드가 아니면 모드만 켬 (선택 시작)
    if (!selectMode) {
      setSelectMode(true);
      return;
    }
    // 선택 모드고, 개수 충족 시 실제 실행
    if (inRange) {
      handleRunAi();
    }
  };

  // 선택 취소
  const handleCancelSelect = () => {
    setSelectedWantIds([]);
    setSelectMode(false);
  };

  const aiButtonDisabled = selectMode ? !inRange || !roomId : false;

  return (
    <div
      className="flex h-full flex-col"
      style={{ width: PANEL_WIDTH, minWidth: PANEL_WIDTH }}
    >
      {/* ✅ 항상 마운트 → STARTED 수신 즉시 모달 노출 */}
      <AiScheduleModal />

      {/* ───────── 헤더 ───────── */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[15px] font-bold text-slate-800 tracking-tight">
              희망장소
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              총 {sharedPlaces.length}개
            </div>
          </div>
        </div>

        {/* 선택 모드 안내 배너 */}
        {selectMode && (
          <div className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-[12px] text-amber-800 border border-amber-100">
            일정 추천에 포함할 장소를 선택하세요.
          </div>
        )}
      </div>

      {/* ───────── 리스트 영역 ───────── */}
      <div className="flex-1 overflow-y-auto px-0 pt-2">
        <SharedPlaceList
          selectMode={selectMode}
          selectedWantIds={selectedWantIds}
          onChangeSelected={setSelectedWantIds}
          onRemove={handleRemove}
        />
      </div>

      {/* ───────── 하단 액션 풋터 ───────── */}
      <div className="border-t border-slate-200 px-4 py-3 bg-white sticky bottom-0">
        {/* 선택 모드일 때만 카운트 표시 */}
        {selectMode && (
          <div className="mb-2 text-xs text-slate-700">
            선택: <b>{count}</b>개
            <div className="text-[11px] text-slate-500">
              (필요: {minCount}~{maxCount}개)
            </div>
          </div>
        )}

        <div
          className={`${
            selectMode ? "grid grid-cols-3" : "grid grid-cols-2"
          } gap-2`}
        >
          {/* 일정표 담기 (상시 노출)
              - 날짜 없으면 서버 확인 → 없으면 여행정보 폼 오픈
              - 날짜 있으면 일정표 모달 오픈 */}
          <button
            type="button"
            onClick={handleOpenItinerary}
            disabled={!roomId || checkingDates}
            className="rounded-lg bg-[#4169e1] px-2 py-2 text-xs font-semibold text-white hover:brightness-95 active:brightness-90 disabled:opacity-50"
            title={
              !roomId
                ? "여행방 정보가 없습니다"
                : !hasDates
                ? "여행 날짜 미설정 시 설정 화면이 열립니다"
                : undefined
            }
          >
            <span className="flex flex-col items-center leading-tight">
              <span>일정표</span>
              <span>담기</span>
            </span>
          </button>

          {selectMode ? (
            <>
              {/* 선택 취소 */}
              <button
                type="button"
                onClick={handleCancelSelect}
                className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100"
                title="선택을 모두 취소하고 선택 모드를 종료합니다"
              >
                <span className="flex flex-col items-center leading-tight">
                  <span>선택</span>
                  <span>취소</span>
                </span>
              </button>

              {/* 일정 추천 시작 */}
              <button
                type="button"
                onClick={handleAiButtonClick}
                disabled={aiButtonDisabled}
                className="rounded-lg bg-black px-2 py-2 text-xs font-semibold text-white hover:brightness-95 active:brightness-90 disabled:opacity-50"
                title={
                  !inRange ? `선택 개수: ${minCount}~${maxCount}개` : undefined
                }
              >
                <span className="flex flex-col items-center leading-tight">
                  <span>일정 추천</span>
                  <span>시작</span>
                </span>
              </button>
            </>
          ) : (
            // 평상시: AI 일정 추천
            <button
              type="button"
              onClick={handleAiButtonClick}
              className="rounded-lg bg-black px-2 py-2 text-xs font-semibold text-white hover:brightness-95 active:brightness-90"
            >
              <span className="flex flex-col items-center leading-tight">
                <span>AI 일정</span>
                <span>추천</span>
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
