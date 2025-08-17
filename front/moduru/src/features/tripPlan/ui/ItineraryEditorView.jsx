// src/features/tripPlan/ui/ItineraryEditorView.jsx
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import ItineraryBoard from "./ItineraryBoard";
import "./ItineraryPanel.css";
import "./ItineraryEditor.css";

import ScheduleSaveButton from "./ScheduleSaveButton";
import useAiRoute from "../../aiRoute/model/useAiRoute";
import { setOrderForDate } from "../../../redux/slices/itinerarySlice";
import { publishSchedule } from "../../webSocket/scheduleSocket";

import useUnsavedGuard from "./useUnsavedGuard";
import useRoomHydration from "../lib/useRoomHydration";

import ExportImageButton from "./ExportImageButton";
import { exportScheduleAsImage } from "../lib/exportScheduleImage";
import {
  selectAiRouteStatus,
  selectRouteByDay,
} from "../../../redux/slices/aiRouteSlice";

const EMPTY_OBJ = Object.freeze({});

export default function ItineraryEditorView({
  onClose,
  headerRef,
  lockScroll = false,
  containerRef, // 🔸 외부 컨테이너 ref (인라인 패널에서 전달)
  hideClose = false, // 🔸 인라인 패널에서 닫기 버튼 숨김
}) {
  const dispatch = useDispatch();
  const roomId = useSelector((s) => s.tripRoom?.roomId);

  const daysMap = useSelector(
    (s) => s.itinerary?.days || EMPTY_OBJ,
    shallowEqual
  );

  useRoomHydration(roomId);

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

  const hasAnyItinerary = useMemo(
    () => Object.values(daysMap).some((arr) => (arr?.length || 0) > 0),
    [daysMap]
  );
  useUnsavedGuard(hasAnyItinerary);

  /* AI 경로 추천 */
  const { runAiRoute } = useAiRoute(roomId);
  const aiStatus = useSelector(selectAiRouteStatus);
  const legsForSelectedDay = useSelector(
    useMemo(() => selectRouteByDay(selectedDay), [selectedDay])
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

  /* 이미지 내보내기 */
  const boardRef = useRef(null);
  const innerBoardRef = useRef(null);
  const [exportArmed, setExportArmed] = useState(false);

  const handleSavedOk = useCallback(() => setExportArmed(true), []);
  useEffect(() => {
    const onCommitOk = (e) => {
      if (!roomId || e?.detail?.roomId === roomId) setExportArmed(true);
    };
    window.addEventListener("schedule:commit:ok", onCommitOk);
    return () => window.removeEventListener("schedule:commit:ok", onCommitOk);
  }, [roomId]);

  /* 🔸 개선된 반응형 패널 크기 감지 */
  const panelRef = useRef(null);
  const [panelWidth, setPanelWidth] = useState(0);
  const [panelType, setPanelType] = useState("side");

  useEffect(() => {
    const targetElement =
      containerRef?.current || panelRef.current?.parentElement;
    if (!targetElement) return;

    const updateDimensions = () => {
      const rect = targetElement.getBoundingClientRect();
      const width = rect.width;
      setPanelWidth(width);

      // 🔸 패널 타입 결정 로직 개선
      const parent = targetElement.parentElement;
      if (parent) {
        const isInline =
          parent.classList.contains("inline-panel") ||
          width > window.innerWidth * 0.7 ||
          width > 800;
        setPanelType(isInline ? "inline" : "side");
      }
    };

    const observer = new ResizeObserver(updateDimensions);
    observer.observe(targetElement);
    updateDimensions();

    return () => observer.disconnect();
  }, [containerRef]);

  // 🔸 보드 크기 계산 로직 개선
  const { boardWidth, visibleBoards, cardWidth } = useMemo(() => {
    const GAP = 16;
    const PADDING = 32;
    const HEADER_HEIGHT = 60;

    let calculatedBoardWidth;
    let calculatedVisibleBoards;

    if (panelType === "inline") {
      // 인라인 패널: 더 유연한 크기 조절
      if (panelWidth < 400) {
        calculatedBoardWidth = 240;
        calculatedVisibleBoards = 1;
      } else if (panelWidth < 600) {
        calculatedBoardWidth = 260;
        calculatedVisibleBoards = 2;
      } else if (panelWidth < 900) {
        calculatedBoardWidth = 280;
        calculatedVisibleBoards = 3;
      } else if (panelWidth < 1200) {
        calculatedBoardWidth = 300;
        calculatedVisibleBoards = 4;
      } else if (panelWidth < 1500) {
        calculatedBoardWidth = 320;
        calculatedVisibleBoards = 4;
      } else {
        calculatedBoardWidth = 340;
        calculatedVisibleBoards = 5;
      }
    } else {
      // 사이드 패널: 더 작은 크기로 최적화
      if (panelWidth < 350) {
        calculatedBoardWidth = 200;
        calculatedVisibleBoards = 1;
      } else if (panelWidth < 500) {
        calculatedBoardWidth = 220;
        calculatedVisibleBoards = 2;
      } else if (panelWidth < 650) {
        calculatedBoardWidth = 240;
        calculatedVisibleBoards = 2;
      } else {
        calculatedBoardWidth = 260;
        calculatedVisibleBoards = 3;
      }
    }

    // 🔸 실제 사용 가능한 공간을 고려한 보드 수 재계산
    const availableWidth = panelWidth - PADDING;
    const maxPossibleBoards = Math.floor(
      availableWidth / (calculatedBoardWidth + GAP)
    );
    const finalVisibleBoards = Math.max(
      1,
      Math.min(calculatedVisibleBoards, maxPossibleBoards)
    );

    // 🔸 보드 수에 맞춰 보드 폭 재조정
    if (finalVisibleBoards < calculatedVisibleBoards && panelWidth > 400) {
      const optimalBoardWidth = Math.floor(
        (availableWidth - GAP * (finalVisibleBoards - 1)) / finalVisibleBoards
      );
      calculatedBoardWidth = Math.max(
        200,
        Math.min(calculatedBoardWidth, optimalBoardWidth)
      );
    }

    const calculatedCardWidth = Math.max(180, calculatedBoardWidth - 40);

    return {
      boardWidth: calculatedBoardWidth,
      visibleBoards: finalVisibleBoards,
      cardWidth: calculatedCardWidth,
    };
  }, [panelWidth, panelType]);

  /* 🔸 화면 배율 상태 개선 */
  const [manualScale, setManualScale] = useState(1);
  const MIN_SCALE = 0.6;
  const MAX_SCALE = 1.2;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const changeScale = (s) => setManualScale(clamp(s, MIN_SCALE, MAX_SCALE));
  const resetScale = () => setManualScale(1);
  const finalScale = manualScale;
  const manualScaleOffset = Math.round((finalScale - 1) * 100);

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

    const prevTransform = root.style.transform;
    const prevWidth = root.style.width;
    const prevOrigin = root.style.transformOrigin;

    root.style.transform = "";
    root.style.transformOrigin = "";
    root.style.width = "";

    try {
      await exportScheduleAsImage(root, { filename });
    } finally {
      root.style.transform = prevTransform;
      root.style.transformOrigin = prevOrigin;
      root.style.width = prevWidth;
    }
  }, [boardRef, daysMap, roomId]);

  /* 날짜 변경 모달 */
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");
  const [selectingEndDate, setSelectingEndDate] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const tripDates = useSelector((s) => s.tripRoom?.tripDates);
  useEffect(() => {
    if (tripDates) {
      setTempStartDate(tripDates.startDate || "");
      setTempEndDate(tripDates.endDate || "");
    }
  }, [tripDates]);

  const getDaysInMonth = useCallback((date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  }, []);

  const formatDateString = useCallback((date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const handleDateSelect = useCallback(
    (date) => {
      const dateStr = formatDateString(date);
      if (!dateStr) return;
      if (!selectingEndDate) {
        setTempStartDate(dateStr);
        setTempEndDate("");
        setSelectingEndDate(true);
      } else {
        if (new Date(dateStr) < new Date(tempStartDate)) {
          setTempStartDate(dateStr);
          setTempEndDate("");
          setSelectingEndDate(true);
        } else {
          setTempEndDate(dateStr);
          setSelectingEndDate(false);
        }
      }
    },
    [selectingEndDate, tempStartDate, formatDateString]
  );

  const isInRange = useCallback(
    (date) => {
      if (!tempStartDate || !tempEndDate || !date) return false;
      const dateStr = formatDateString(date);
      return dateStr >= tempStartDate && dateStr <= tempEndDate;
    },
    [tempStartDate, tempEndDate, formatDateString]
  );

  const isStartDate = useCallback(
    (date) => tempStartDate && date && formatDateString(date) === tempStartDate,
    [tempStartDate, formatDateString]
  );

  const isEndDate = useCallback(
    (date) => tempEndDate && date && formatDateString(date) === tempEndDate,
    [tempEndDate, formatDateString]
  );

  const handleDateChange = useCallback(() => {
    if (!tempStartDate || !tempEndDate) {
      alert("시작일과 종료일을 모두 선택해주세요.");
      return;
    }
    dispatch({
      type: "tripRoom/updateDates",
      payload: { startDate: tempStartDate, endDate: tempEndDate, roomId },
    });
    if (roomId) {
      publishSchedule({
        roomId,
        type: "UPDATE_DATES",
        startDate: tempStartDate,
        endDate: tempEndDate,
      });
    }
    setShowDateModal(false);
    setSelectingEndDate(false);
  }, [tempStartDate, tempEndDate, roomId, dispatch]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (showDateModal) {
          setShowDateModal(false);
        } else {
          onClose?.();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    if (lockScroll) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      if (lockScroll) document.body.style.overflow = prev;
    };
  }, [onClose, lockScroll, showDateModal]);

  const tripDuration = useMemo(() => {
    if (!tempStartDate || !tempEndDate) return 0;
    return Math.ceil(
      (new Date(tempEndDate) - new Date(tempStartDate)) /
        (1000 * 60 * 60 * 24) +
        1
    );
  }, [tempStartDate, tempEndDate]);

  return (
    <div
      ref={panelRef}
      className="itinerary-editor"
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* 헤더 - 고정 높이 */}
      <header
        ref={headerRef}
        className="itinerary-editor__header itinerary-editor__header--compact"
        style={{
          height: "60px", // 🔸 고정 높이 설정
          minHeight: "60px",
          maxHeight: "60px",
          flexShrink: 0, // 🔸 축소 방지
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "white",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          className="itinerary-editor__header-left"
          style={{ display: "flex", alignItems: "center" }}
        >
          <h2
            className="itinerary-editor__title"
            style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}
          >
            일정 편집
          </h2>
        </div>

        <div
          className="itinerary-editor__header-center"
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <ScheduleSaveButton
            small
            onSaved={handleSavedOk}
            customStyle="itinerary-editor__button itinerary-editor__button--compact"
          />
          <ExportImageButton
            small
            armed={exportArmed}
            onExport={handleExportImage}
            onDisarm={() => setExportArmed(false)}
            customStyle="itinerary-editor__button itinerary-editor__button--compact"
          />
          <div className="itinerary-editor__divider itinerary-editor__divider--short" />
          <span className="itinerary-editor__status itinerary-editor__status--inline">
            {visibleBoards}일 · {boardWidth}px · {Math.round(panelWidth)}px
          </span>
          <select
            value={String(Math.round(finalScale * 100))}
            onChange={(e) => changeScale(Number(e.target.value) / 100)}
            className="itinerary-editor__select itinerary-editor__select--scale itinerary-editor__select--compact"
            title="화면 배율"
          >
            <option value="60">60%</option>
            <option value="70">70%</option>
            <option value="80">80%</option>
            <option value="90">90%</option>
            <option value="100">100%</option>
            <option value="110">110%</option>
            <option value="120">120%</option>
          </select>
          {manualScaleOffset !== 0 && (
            <button
              type="button"
              onClick={resetScale}
              className="itinerary-editor__button itinerary-editor__button--ghost itinerary-editor__button--reset itinerary-editor__button--compact"
              title="자동 크기로 리셋"
            >
              ↺
            </button>
          )}
        </div>

        <div
          className="itinerary-editor__header-right"
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <button
            type="button"
            onClick={() => setShowDateModal(true)}
            className="itinerary-editor__button itinerary-editor__button--ghost itinerary-editor__button--compact"
          >
            📅
          </button>
          {!hideClose && (
            <button
              type="button"
              aria-label="닫기"
              onClick={onClose}
              className="itinerary-editor__button itinerary-editor__button--icon itinerary-editor__button--compact"
              title="닫기 (ESC)"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {/* 날짜 변경 모달 */}
      {showDateModal && (
        <div
          className="itinerary-editor__modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDateModal(false);
              setSelectingEndDate(false);
            }
          }}
        >
          <div className="itinerary-editor__modal">
            <div className="itinerary-editor__modal-header">
              <h3>여행 날짜 변경</h3>
              <button
                type="button"
                onClick={() => {
                  setShowDateModal(false);
                  setSelectingEndDate(false);
                }}
                className="itinerary-editor__button itinerary-editor__button--icon"
              >
                ✕
              </button>
            </div>

            <div className="itinerary-editor__modal-body">
              <div className="itinerary-editor__date-picker">
                <div className="itinerary-editor__calendar-header">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentMonth(
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth() - 1
                        )
                      )
                    }
                    className="itinerary-editor__button itinerary-editor__button--ghost"
                  >
                    ‹
                  </button>
                  <span className="itinerary-editor__month-year">
                    {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}
                    월
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentMonth(
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth() + 1
                        )
                      )
                    }
                    className="itinerary-editor__button itinerary-editor__button--ghost"
                  >
                    ›
                  </button>
                </div>

                <div className="itinerary-editor__calendar-grid">
                  <div className="itinerary-editor__weekdays">
                    {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                      <div key={day} className="itinerary-editor__weekday">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="itinerary-editor__days">
                    {getDaysInMonth(currentMonth).map((date, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`itinerary-editor__day ${
                          !date ? "itinerary-editor__day--empty" : ""
                        } ${
                          isStartDate(date)
                            ? "itinerary-editor__day--start"
                            : ""
                        } ${
                          isEndDate(date) ? "itinerary-editor__day--end" : ""
                        } ${
                          isInRange(date)
                            ? "itinerary-editor__day--in-range"
                            : ""
                        }`}
                        onClick={() => date && handleDateSelect(date)}
                        disabled={!date}
                      >
                        {date ? date.getDate() : ""}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="itinerary-editor__date-summary">
                <div className="itinerary-editor__selected-dates">
                  <div>
                    <strong>시작일:</strong> {tempStartDate || "미선택"}
                  </div>
                  <div>
                    <strong>종료일:</strong> {tempEndDate || "미선택"}
                  </div>
                  {tripDuration > 0 && (
                    <div>
                      <strong>기간:</strong> {tripDuration}일
                    </div>
                  )}
                </div>

                <div className="itinerary-editor__date-status">
                  {selectingEndDate
                    ? "종료일을 선택해주세요"
                    : "시작일을 선택해주세요"}
                </div>
              </div>
            </div>

            <div className="itinerary-editor__modal-footer">
              <button
                type="button"
                onClick={() => {
                  setShowDateModal(false);
                  setSelectingEndDate(false);
                }}
                className="itinerary-editor__button itinerary-editor__button--ghost"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDateChange}
                className="itinerary-editor__button itinerary-editor__button--primary"
                disabled={!tempStartDate || !tempEndDate}
              >
                적용
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 보드 영역 - 헤더 높이만큼 여백 확보 */}
      <div
        className="itinerary-editor__body"
        style={{
          overflow: "hidden",
          height: "calc(100vh - 60px)", // 🔸 헤더 높이만큼 빼기
          flex: 1,
        }}
      >
        <div
          ref={boardRef}
          className="itinerary-editor__board-container"
          style={{
            transform: `scale(${finalScale})`,
            transformOrigin: "top left",
            width: `${(1 / finalScale) * 100}%`,
            height: `${(1 / finalScale) * 100}%`,
            overflow: "auto", // 🔸 스케일링으로 잘린 부분 스크롤 가능
          }}
        >
          <ItineraryBoard
            ref={innerBoardRef}
            showEta
            boardWidth={boardWidth} // 🔸 동적 보드 폭 전달
            visibleBoards={visibleBoards} // 🔸 동적 표시 보드 수 전달
            panelType={panelType} // 🔸 패널 타입 전달
          />
        </div>
      </div>
    </div>
  );
}
