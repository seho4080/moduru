// src/features/tripPlan/ui/ItineraryEditorView.jsx
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import ItineraryBoard from "./ItineraryBoard";
import "./ItineraryPanel.css";
import { openTripForm } from "../../../redux/slices/uiSlice";

import ScheduleSaveButton from "./ScheduleSaveButton";
import useAiRoute from "../../aiRoute/model/useAiRoute";
import { setOrderForDate, setDays } from "../../../redux/slices/itinerarySlice"; // ← setDays 리듀서 필요
// alias(@) 미사용: 상대경로로 안전하게
import { publishSchedule } from "../../webSocket/scheduleSocket";

import useUnsavedGuard from "./useUnsavedGuard";
// hydration 훅은 lib로 이동
import useRoomHydration from "../lib/useRoomHydration";

// 내보내기
import ExportImageButton from "./ExportImageButton";
import { exportScheduleAsImage } from "../lib/exportScheduleImage";

const EMPTY_OBJ = Object.freeze({});

/** 컴팩트 헤더/버튼 공통 스타일 */
const BTN_BASE = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 26,
  padding: "0 8px",
  fontSize: 12,
  lineHeight: 1,
  borderRadius: 6,
  textAlign: "center",
  whiteSpace: "nowrap",
};
const BTN_ICON = {
  ...BTN_BASE,
  width: 26,
  padding: 0,
};
const SELECT_SM = {
  height: 26,
  padding: "2px 8px",
  fontSize: 12,
  borderRadius: 6,
  lineHeight: 1,
};

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

  // ✅ 배열 자체 의존: 기존 선택 유지/없으면 첫째날
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

  /* ===================== 변경 감지(dirty) & 저장 반영 ===================== */
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

  /* ===================== 날짜 저장 후 재매핑 ===================== */
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

  /* ===================== 이미지 내보내기 ===================== */
  // 보드 DOM 참조 (래퍼에 부착해서 스케일 포함 영역을 캡처)
  const boardRef = useRef(null);
  // (선택) 내부 보드 ref가 필요하면 유지
  const innerBoardRef = useRef(null);

  // 저장 성공 시에만 내보내기 버튼 "무장(armed)"
  const [exportArmed, setExportArmed] = useState(false);

  // ScheduleSaveButton이 onSaved 콜백을 지원할 경우
  const handleSavedOk = useCallback(() => {
    // 서버 커밋 성공 시 별도 이벤트도 오지만, 버튼 자체 콜백이 있으면 바로 무장
    setExportArmed(true);
  }, []);

  // 실제 내보내기: 캡처 전에 100%로 복원 → 캡처 후 배율 되돌림
  const handleExportImage = useCallback(async () => {
    const root = boardRef.current;
    if (!root) {
      alert("보드를 찾을 수 없어요. 새로고침 후 다시 시도해주세요.");
      return;
    }
    const allDates = Object.keys(daysMap).sort();
    // ⬇️ 여기서 날짜 문자열의 '-' 를 제거해서 파일명에 YYYYMMDD로 사용(“날짜 자르는 부분”)
    const a = (allDates[0] || "start").split("-").join("");
    const b = (allDates[allDates.length - 1] || "end").split("-").join("");
    const filename = `schedule_${roomId || "room"}_${a}-${b}.png`;

    // 배율 임시 해제
    const prevTransform = root.style.transform;
    const prevWidth = root.style.width;
    const prevOrigin = root.style.transformOrigin;

    root.style.transform = "";
    root.style.transformOrigin = "";
    root.style.width = "";

    try {
      await exportScheduleAsImage(root, { filename });
    } finally {
      // 복원
      root.style.transform = prevTransform;
      root.style.transformOrigin = prevOrigin;
      root.style.width = prevWidth;
    }
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
      {/* 헤더 (컴팩트 버전) */}
      <div
        className="itin-header"
        ref={headerRef}
        style={{
          padding: "4px 8px",
          gap: 6,
          alignItems: "center",
          minHeight: "36px",
          display: "flex",
          flexWrap: "wrap",
        }}
      >
        {/* 왼쪽: 제목 + Day 선택 */}
        <div
          className="itin-title"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1 }}>
            일정 편집
          </span>
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(Number(e.target.value))}
            title="날짜 선택"
            style={SELECT_SM}
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
            display: "inline-flex",
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
              style={BTN_BASE}
            >
              {routeBusy ? "AI 생성…" : "AI 추천"}
            </button>

            {aiStatus === "DONE" && legsForSelectedDay.length > 0 && (
              <button
                type="button"
                className="btn ghost"
                onClick={onApplyRoute}
                title="추천 결과를 이 일차에 적용"
                style={BTN_BASE}
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
            <div style={{ display: "inline-flex", alignItems: "center" }}>
              <ScheduleSaveButton small onSaved={handleSavedOk} />
            </div>

            {/* 저장 성공시에만 활성화, 내보내기 완료 후 자동 비활성화 */}
            <div style={{ display: "inline-flex", alignItems: "center" }}>
              <ExportImageButton
                small
                armed={exportArmed}
                onExport={handleExportImage}
                onDisarm={() => setExportArmed(false)}
              />
            </div>
          </div>

          {/* 보기 배율(줌) — 주석 처리 */}
          {/*
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              paddingLeft: 6,
              marginLeft: 4,
              borderLeft: "1px solid #e5e7eb",
            }}
            title="보드 보기 배율"
          >
            <span style={{ fontSize: 12, lineHeight: 1 }}>줌</span>
            <select
              value={String(Math.round(boardScale * 100))}
              onChange={(e) => changeScale(Number(e.target.value) / 100)}
              style={SELECT_SM}
            >
              <option value="70">70%</option>
              <option value="80">80%</option>
              <option value="90">90%</option>
              <option value="100">100%</option>
            </select>
          </div>
          */}
        </div>

        {/* 오른쪽: 날짜 변경 / 닫기 */}
        <div
          className="itin-actions"
          style={{ display: "inline-flex", gap: 6, marginLeft: 8 }}
        >
          <button
            type="button"
            className="btn ghost"
            onClick={() => dispatch(openTripForm())}
            style={BTN_BASE}
          >
            날짜 변경
          </button>
          <button
            type="button"
            className="btn icon"
            aria-label="닫기"
            onClick={onClose}
            style={BTN_ICON}
            title="닫기"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="itin-body">
        {/* 보드 래퍼 */}
        <div
          ref={boardRef}
          style={{
            // transform: `scale(${boardScale})`,
            // transformOrigin: "top left",
            // width: `${100 / boardScale}%`,
          }}
        >
          {/* 내부 보드 ref가 필요한 경우 대비 */}
          <ItineraryBoard ref={innerBoardRef} showEta />
        </div>
      </div>
    </>
  );
}
