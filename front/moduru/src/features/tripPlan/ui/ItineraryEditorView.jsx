// src/features/tripPlan/ui/ItineraryEditorView.jsx
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";

import ItineraryBoard from "./ItineraryBoard";
import "./ItineraryPanel.css";
import "./ItineraryEditor.css";

import ScheduleSaveButton from "./ScheduleSaveButton";
import ExportImageButton from "./ExportImageButton";

import { setOrderForDate, setDays } from "../../../redux/slices/itinerarySlice";
import { publishSchedule } from "../../webSocket/scheduleSocket";

import useUnsavedGuard from "./useUnsavedGuard";
import useRoomHydration from "../lib/useRoomHydration";
import { exportScheduleAsImage } from "../lib/exportScheduleImage";

const EMPTY_OBJ = Object.freeze({});

export default function ItineraryEditorView({
  onClose,
  headerRef,
  lockScroll = false,
  containerRef,
  hideClose = false,
  onCardClick,
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

  // 변경 감지(dirty) & 저장 반영
  const lastSavedSig = useRef("");
  const [dirty, setDirty] = useState(false);

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

  useEffect(() => {
    if (lastSavedSig.current === "") {
      lastSavedSig.current = makeSig(daysMap);
    }
  }, [daysMap, makeSig]);

  useEffect(() => {
    const now = makeSig(daysMap);
    const changed = now !== lastSavedSig.current;
    setDirty(changed);
  }, [daysMap, makeSig]);

  const [exportArmed, setExportArmed] = useState(false);
  const handleSavedOk = useCallback(() => setExportArmed(true), []);
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

  useUnsavedGuard(dirty);

  // 날짜 저장 이후 재매핑(외부에서 날짜가 바뀐 경우 대응)
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
    };
    window.addEventListener("trip:dates:changed", onDatesChanged);
    return () =>
      window.removeEventListener("trip:dates:changed", onDatesChanged);
  }, [roomId, daysMap, dispatch, remapDaysByNewDates]);

  // 이미지 내보내기
  const boardRef = useRef(null);
  const innerBoardRef = useRef(null);

  useEffect(() => {
    const onCommitOk = (e) => {
      if (!roomId || e?.detail?.roomId === roomId) setExportArmed(true);
    };
    window.addEventListener("schedule:commit:ok", onCommitOk);
    return () => window.removeEventListener("schedule:commit:ok", onCommitOk);
  }, [roomId]);

  const handleExportImage = useCallback(async () => {
    // 보드 내부 루트만 캡처(보드 내부 버튼은 data-html2canvas-ignore="true")
    const root =
      innerBoardRef.current ||
      boardRef.current ||
      document.getElementById("itinerary-board-root");

    if (!root) {
      alert("보드를 찾을 수 없어요. 새로고침 후 다시 시도해주세요.");
      return;
    }

    const allDates = Object.keys(daysMap).sort();
    const a = (allDates[0] || "start").split("-").join("");
    const b = (allDates[allDates.length - 1] || "end").split("-").join("");
    const filename = `schedule_${roomId || "room"}_${a}-${b}.png`;

    try {
      await exportScheduleAsImage(root, { filename });
    } catch (error) {
      console.error("Export failed:", error);
      alert("이미지 내보내기에 실패했습니다.");
    }
  }, [boardRef, innerBoardRef, daysMap, roomId]);

  // ESC 및 스크롤 잠금(캘린더 제거로 단순화)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    if (lockScroll) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      if (lockScroll) document.body.style.overflow = prev;
    };
  }, [onClose, lockScroll]);

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
      <header
        ref={headerRef}
        className="itinerary-editor__header itinerary-editor__header--compact"
        style={{
          height: "50px",
          minHeight: "50px",
          maxHeight: "50px",
          flexShrink: 0,
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
          className="itinerary-editor__header-right"
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

      <div
        className="itinerary-editor__body"
        style={{
          overflow: "hidden",
          height: "calc(100vh - 50px)",
          flex: 1,
        }}
      >
        <div
          ref={boardRef}
          className="itinerary-editor__board-container"
          style={{ overflow: "auto" }}
        >
          <ItineraryBoard
            ref={innerBoardRef}
            showEta
            onCardClick={onCardClick}
          />
        </div>
      </div>
    </div>
  );
}
