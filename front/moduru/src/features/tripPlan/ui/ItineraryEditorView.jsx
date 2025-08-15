// src/features/tripPlan/ui/ItineraryEditorView.jsx
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import ItineraryBoard from "./ItineraryBoard";
import "./ItineraryPanel.css";
import { openTripForm } from "../../../redux/slices/uiSlice";

import ScheduleSaveButton from "./ScheduleSaveButton";
import useAiRoute from "../../aiRoute/model/useAiRoute";
import { setOrderForDate } from "../../../redux/slices/itinerarySlice";
// alias(@) 미사용: 상대경로로 안전하게
import { publishSchedule } from "../../webSocket/scheduleSocket";

import useUnsavedGuard from "./useUnsavedGuard";
// hydration 훅은 lib로 이동
import useRoomHydration from "../lib/useRoomHydration";

// 내보내기
import ExportImageButton from "./ExportImageButton";
import { exportScheduleAsImage } from "../lib/exportScheduleImage";

const EMPTY_OBJ = Object.freeze({});

export default function ItineraryEditorView({
  onClose,
  headerRef,
  lockScroll = false,
}) {
  const dispatch = useDispatch();
  const roomId = useSelector((s) => s.tripRoom?.roomId);

  // 일정 보드 데이터
  const daysMap = useSelector(
    (s) => s.itinerary?.days || EMPTY_OBJ,
    shallowEqual
  );

  // 방 입장/새로고침 시 서버 데이터로 복원 (비어있을 때만)
  useRoomHydration(roomId);

  // Day 옵션 목록
  const dayOptions = useMemo(() => {
    const entries = Object.entries(daysMap);
    if (entries.length === 0) return [];
    if (Array.isArray(entries[0][1])) {
      return entries
        .map(([dateKey, events]) => ({
          date: dateKey,
          events: Array.isArray(events) ? events : [],
        }))
        .sort((a, b) => String(a.date).localeCompare(String(b.date)))
        .map((d, i) => ({ day: i + 1, ...d }));
    }
    return [];
  }, [daysMap]);

  const [selectedDay, setSelectedDay] = useState(() =>
    dayOptions.length ? dayOptions[0].day : 1
  );
  useEffect(() => {
    if (dayOptions.length) setSelectedDay(dayOptions[0].day);
  }, [dayOptions.length]);

  const currentDate = useMemo(
    () => dayOptions.find((d) => d.day === selectedDay)?.date,
    [dayOptions, selectedDay]
  );
  const currentEvents = useMemo(
    () => dayOptions.find((d) => d.day === selectedDay)?.events ?? [],
    [dayOptions, selectedDay]
  );

  // 저장 안 한 변경 내역 경고(배너는 제거, 가드만 유지)
  const hasAnyItinerary = useMemo(
    () => Object.values(daysMap).some((arr) => (arr?.length || 0) > 0),
    [daysMap]
  );
  useUnsavedGuard(hasAnyItinerary);

  /* ===================== AI 경로 추천 ===================== */
  const { runAiRoute } = useAiRoute(roomId);
  const routeState = useSelector((s) => s.aiRoute);
  const aiStatus = routeState?.status ?? "IDLE";
  const legsForSelectedDay = useSelector(
    (s) => s.aiRoute?.routesByDay?.[selectedDay] ?? []
  );
  const placeListForSelectedDay = useMemo(
    () =>
      currentEvents
        .filter((e) => e?.wantId != null)
        .map((e) => Number(e.wantId)),
    [currentEvents]
  );

  const [asking, setAsking] = useState(false);
  const routeBusy = asking || aiStatus === "STARTED" || aiStatus === "PROGRESS";

  const onRunAiRoute = useCallback(async () => {
    if (!roomId) return;
    if (placeListForSelectedDay.length < 2) {
      alert("이 일차에 최소 2개 장소가 있어야 경로를 추천할 수 있어요.");
      return;
    }
    setAsking(true);
    try {
      const r = await runAiRoute(selectedDay, placeListForSelectedDay);
      if (!r || r.ok !== true) {
        const code = r?.code;
        const msg = r?.message;
        if (code === 409) alert(msg || "이미 이 일차 작업이 진행 중입니다.");
        else if (code === 400) alert(msg || "요청 형식 오류입니다.");
        else if (code === -1) alert(msg || "네트워크 오류가 발생했습니다.");
        else alert(msg || "AI 경로 요청에 실패했습니다.");
      }
    } catch (e) {
      console.error("[ai-route] request failed:", e);
      alert(e?.message || "AI 경로 요청 중 오류가 발생했습니다.");
    } finally {
      setAsking(false);
    }
  }, [roomId, runAiRoute, selectedDay, placeListForSelectedDay]);

  const onApplyRoute = useCallback(() => {
    if (!Array.isArray(legsForSelectedDay) || !legsForSelectedDay.length)
      return;
    if (!currentDate || !roomId) return;

    const orderWantIds = [...legsForSelectedDay]
      .sort((a, b) => (a?.eventOrder ?? 0) - (b?.eventOrder ?? 0))
      .map((l) => Number(l.wantId));

    dispatch(
      setOrderForDate({ dateKey: currentDate, wantOrderIds: orderWantIds })
    );
    publishSchedule({
      roomId,
      type: "UPDATE_ORDER",
      dateKey: currentDate,
      wantOrderIds: orderWantIds,
    });
  }, [legsForSelectedDay, currentDate, roomId, dispatch]);

  /* ===================== 이미지 내보내기 ===================== */
  // 보드 DOM 참조
  const boardRef = useRef(null);

  // 저장 성공 시에만 내보내기 버튼 "무장(armed)"
  const [exportArmed, setExportArmed] = useState(false);

  // ScheduleSaveButton이 onSaved 콜백을 지원할 경우
  const handleSavedOk = useCallback(() => {
    setExportArmed(true);
  }, []);

  // 콜백이 없다면, 저장 로직에서 window 이벤트를 쏘도록 하고 여기서 수신
  useEffect(() => {
    const onCommitOk = (e) => {
      if (!roomId || e?.detail?.roomId === roomId) setExportArmed(true);
    };
    window.addEventListener("schedule:commit:ok", onCommitOk);
    return () => window.removeEventListener("schedule:commit:ok", onCommitOk);
  }, [roomId]);

  // 실제 내보내기
  const handleExportImage = useCallback(async () => {
    const root = boardRef.current;
    if (!root) {
      alert("보드를 찾을 수 없어요. 새로고침 후 다시 시도해주세요.");
      return;
    }
    const allDates = Object.keys(daysMap).sort();
    const a = (allDates[0] || "start").split("-").join("");
    const b = (allDates[allDates.length - 1] || "end").split("-").join("");
    const filename = `schedule_${roomId || "room"}_${a}-${b}.png`;

    await exportScheduleAsImage(root, { filename });
  }, [boardRef, daysMap, roomId]);

  /* ===================== ESC 닫기 + 스크롤 락 ===================== */
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    if (lockScroll) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      if (lockScroll) document.body.style.overflow = prev;
    };
  }, [onClose, lockScroll]);

  return (
    <>
      {/* 헤더 (소요시간 관련 UI는 제거됨) */}
      <div
        className="itin-header"
        ref={headerRef}
        style={{
          padding: "6px 10px",
          gap: 8,
          alignItems: "center",
          minHeight: "44px",
        }}
      >
        {/* 왼쪽: 제목 + Day 선택 */}
        <div
          className="itin-title"
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <span style={{ fontSize: 14, fontWeight: 700 }}>일정 편집</span>
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(Number(e.target.value))}
            title="날짜 선택"
            style={{
              height: 28,
              padding: "2px 8px",
              fontSize: 12,
              borderRadius: 6,
            }}
          >
            {dayOptions.map((d) => (
              <option key={d.day} value={d.day}>
                {`D${d.day} ${d.date}`}
              </option>
            ))}
          </select>
        </div>

        {/* 가운데: 툴바 (AI + 저장 + 이미지 내보내기) */}
        <div
          className="itin-toolbar"
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            flexWrap: "wrap",
            marginLeft: "auto",
          }}
        >
          {/* AI */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <button
              type="button"
              className="btn"
              onClick={onRunAiRoute}
              disabled={routeBusy || placeListForSelectedDay.length < 2}
              title="이 일차의 장소들로 AI 경로를 추천"
              style={{
                height: 28,
                padding: "0 10px",
                fontSize: 12,
                borderRadius: 6,
              }}
            >
              {routeBusy ? "AI 생성…" : "AI 추천"}
            </button>

            {aiStatus === "DONE" && legsForSelectedDay.length > 0 && (
              <button
                type="button"
                className="btn ghost"
                onClick={onApplyRoute}
                title="추천 결과를 이 일차에 적용"
                style={{
                  height: 28,
                  padding: "0 10px",
                  fontSize: 12,
                  borderRadius: 6,
                }}
              >
                적용
              </button>
            )}
          </div>

          {/* 저장 + 이미지 내보내기 */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              paddingLeft: 6,
              marginLeft: 4,
              borderLeft: "1px solid #e5e7eb",
            }}
          >
            {/* 저장 성공시 onSaved로 무장 */}
            <ScheduleSaveButton small onSaved={handleSavedOk} />

            {/* 저장 성공시에만 활성화, 내보내기 완료 후 자동 비활성화 */}
            <ExportImageButton
              small
              armed={exportArmed}
              onExport={handleExportImage}
              onDisarm={() => setExportArmed(false)}
            />
          </div>
        </div>

        {/* 오른쪽: 날짜 변경 / 닫기 */}
        <div
          className="itin-actions"
          style={{ display: "flex", gap: 6, marginLeft: 8 }}
        >
          <button
            type="button"
            className="btn ghost"
            onClick={() => dispatch(openTripForm())}
            style={{
              height: 28,
              padding: "0 10px",
              fontSize: 12,
              borderRadius: 6,
            }}
          >
            날짜 변경
          </button>
          <button
            type="button"
            className="btn icon"
            aria-label="닫기"
            onClick={onClose}
            style={{ height: 28, width: 28, borderRadius: 6, fontSize: 14 }}
            title="닫기"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="itin-body">
        {/* 보드 ref 연결: 이미지 내보내기에서 캡처 대상 */}
        <ItineraryBoard ref={boardRef} showEta />
      </div>
    </>
  );
}
