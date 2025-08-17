// src/features/tripPlan/ui/ItineraryEditorView.jsx
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import ItineraryBoard from "./ItineraryBoard";
import "./ItineraryPanel.css";
import "./ItineraryEditor.css";

import ScheduleSaveButton from "./ScheduleSaveButton";
import useAiRoute from "../../aiRoute/model/useAiRoute";
import { setOrderForDate, setDays } from "../../../redux/slices/itinerarySlice";
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
  containerRef, // 외부 컨테이너 ref (인라인 패널에서 전달)
  hideClose = false, // 인라인 패널에서 닫기 버튼 숨김
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

  // 배열 자체 의존: 기존 선택 유지/없으면 첫째날
  useEffect(() => {
    if (!dayOptions.length) return;
    setSelectedDay((prev) =>
      dayOptions.some((d) => d.day === prev) ? prev : dayOptions[0].day
    );
  }, [dayOptions]);

  const currentDate = useMemo(
    () => dayOptions.find((d) => d.day === selectedDay)?.date,
    [dayOptions, selectedDay]
  );
  const currentEvents = useMemo(
    () => dayOptions.find((d) => d.day === selectedDay)?.events ?? [],
    [dayOptions, selectedDay]
  );

  /* 변경 감지(dirty) & 저장 반영 */
  const lastSavedSig = useRef("");
  const [dirty, setDirty] = useState(false);

  // 날짜/순서만 추린 시그니처 (저장 비교용)
  const makeSig = useCallback((m) => {
    return JSON.stringify(
      Object.entries(m)
        .sort(([a], [b]) => String(a).localeCompare(String(b)))
        .map(([date, events]) => [
          date,
          (events ?? []).map((e) => Number(e.wantId ?? e.id ?? -1)),
        ])
    );
  }, []);

  // 최초 로드 시 baseline 잡기 (초기 더티 방지)
  useEffect(() => {
    if (lastSavedSig.current === "") {
      lastSavedSig.current = makeSig(daysMap);
    }
  }, [daysMap, makeSig]);

  // daysMap이 바뀌면 dirty 판정 + 내보내기 비무장
  useEffect(() => {
    const now = makeSig(daysMap);
    const changed = now !== lastSavedSig.current;
    setDirty(changed);
  }, [daysMap, makeSig]);

  // 저장/더티 커스텀 이벤트 수신
  useEffect(() => {
    const onSaved = (e) => {
      if (!roomId || e?.detail?.roomId === roomId) {
        lastSavedSig.current = makeSig(daysMap);
        setDirty(false);
        setExportArmed(true);
      }
    };
    const onDirty = (e) => {
      if (!roomId || e?.detail?.roomId === roomId) {
        setDirty(true);
        setExportArmed(false);
      }
    };
    window.addEventListener("schedule:commit:ok", onSaved);
    window.addEventListener("schedule:dirty", onDirty);
    return () => {
      window.removeEventListener("schedule:commit:ok", onSaved);
      window.removeEventListener("schedule:dirty", onDirty);
    };
  }, [roomId, daysMap, makeSig]);

  // 페이지 이탈/닫기 가드
  useUnsavedGuard(dirty);

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
  const routeBusy =
    asking || aiStatus === "STARTED" || aiStatus === "PROGRESS";

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

    // 변경 발생 → dirty 알림
    window.dispatchEvent(
      new CustomEvent("schedule:dirty", { detail: { roomId } })
    );
  }, [legsForSelectedDay, currentDate, roomId, dispatch]);

  /* 날짜 저장 후 재매핑 */
  const remapDaysByNewDates = useCallback((oldMap, newDates) => {
    const sortedOld = Object.entries(oldMap)
      .sort(([a], [b]) => String(a).localeCompare(String(b)))
      .map(([, ev]) => ev ?? []);
    const next = {};
    newDates.forEach((d, i) => {
      next[d] = sortedOld[i] ?? [];
    });
    return next;
  }, []);

  useEffect(() => {
    const onDatesChanged = (e) => {
      if (e?.detail?.roomId !== roomId) return;
      const { newDates, ok } = e.detail || {};
      if (!ok || !Array.isArray(newDates) || !newDates.length) return;
      const next = remapDaysByNewDates(daysMap, newDates);
      dispatch(setDays(next));
      setSelectedDay(1);
      // 저장으로 취급 → baseline 갱신은 commit:ok 이벤트에서 처리됨
    };
    window.addEventListener("trip:dates:changed", onDatesChanged);
    return () =>
      window.removeEventListener("trip:dates:changed", onDatesChanged);
  }, [roomId, daysMap, dispatch, remapDaysByNewDates]);

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

  const handleExportImage = useCallback(async () => {
    const root = boardRef.current;
    if (!root) {
      alert("보드를 찾을 수 없어요. 새로고침 후 다시 시도해주세요.");
      return;
    }
    const allDates = Object.keys(daysMap).sort();
    // 날짜 문자열의 '-' 를 제거해서 파일명에 YYYYMMDD로 사용
    const a = (allDates[0] || "start").split("-").join("");
    const b = (allDates[allDates.length - 1] || "end").split("-").join("");
    const filename = `schedule_${roomId || "room"}_${a}-${b}.png`;

    try {
      await exportScheduleAsImage(root, { filename });
    } catch (error) {
      console.error("Export failed:", error);
      alert("이미지 내보내기에 실패했습니다.");
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
          height: "60px", // 고정 높이 설정
          minHeight: "60px",
          maxHeight: "60px",
          flexShrink: 0, // 축소 방지
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
          height: "calc(100vh - 60px)", // 헤더 높이만큼 빼기
          flex: 1,
        }}
      >
        <div
          ref={boardRef}
          className="itinerary-editor__board-container"
          style={{
            overflow: "auto",
          }}
        >
          <ItineraryBoard
            ref={innerBoardRef}
            showEta
          />
        </div>
      </div>
    </div>
  );
}