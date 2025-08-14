import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import ItineraryBoard from "./ItineraryBoard";
import "./ItineraryModal.css";
import { openTripForm } from "../../../redux/slices/uiSlice";

// 소요시간 계산용 소켓/훅/발행
import useTravelStatus from "../../travelTime/ui/useTravelStatus";
import useTravelResultSocket from "../../travelTime/ui/useTravelResultSocket";
import { publishTravel } from "../../webSocket/travelSocket";
import ScheduleSaveButton from "./ScheduleSaveButton";

/**
 * 일정 편집 모달(보드 버전)
 * - 헤더 드래그로 패널 이동 가능
 * - 본문에는 ItineraryBoard만 배치(날짜 열/드래그/시간편집 모두 보드가 담당)
 * - ⬇️ 추가: 상단 툴바에서 '하루 단위 소요시간 계산' 트리거 + 상태 표시
 */
export default function ItineraryModal(props) {
  return createPortal(<ModalInner {...props} />, document.body);
}

function ModalInner({ onClose }) {
  const dispatch = useDispatch();
  const panelRef = useRef(null);
  const headerRef = useRef(null);

  const roomId = useSelector((s) => s.tripRoom?.roomId);
  const daysMap = useSelector((s) => s.itinerary?.days ?? {});
  const userEmail = useSelector((s) => s.user?.userInfo?.email);

  const dayOptions = useMemo(() => {
    const entries = Object.entries(daysMap || {});
    if (entries.length === 0) return [];

    // 값이 배열이면 => { [dateKey]: events[] } 케이스
    if (Array.isArray(entries[0][1])) {
      return entries
        .map(([dateKey, events]) => ({
          date: dateKey,
          events: Array.isArray(events) ? events : [],
        }))
        .sort((a, b) => String(a.date).localeCompare(String(b.date)))
        .map((d, i) => ({ day: i + 1, ...d }));
    }

    // 객체 케이스 안전 매핑
    return entries
      .map(([, v]) => {
        const date = v?.date ?? v?.dateKey ?? v?.date_key;
        const events = Array.isArray(v?.events)
          ? v.events
          : Array.isArray(v?.items)
          ? v.items
          : [];
        const day = v?.day ?? v?.index ?? null;
        return date ? { day, date, events } : null;
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (a.day != null && b.day != null) return a.day - b.day;
        return String(a.date).localeCompare(String(b.date));
      })
      .map((d, i) => (d.day != null ? d : { ...d, day: i + 1 }));
  }, [daysMap]);

  useEffect(() => {
    console.log("[Itin] daysMap raw =", daysMap);
  }, [daysMap]);

  useEffect(() => {
    console.log("[Itin] dayOptions =", dayOptions);
  }, [dayOptions]);

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

  const [transpot, setTranspot] = useState("driving");

  const { loading, buttonDisabled, error, setError } = useTravelStatus(roomId, {
    onToast: (m) => console.info("[Toast]", m),
  });
  useTravelResultSocket(roomId);

  // 버튼 비활성화 조건을 변수로
  const calcDisabled =
    buttonDisabled || !roomId || !currentDate || currentEvents.length < 2;

  // disabled 이유 추적
  useEffect(() => {
    console.log("[CalcBtn] disabled reason", {
      buttonDisabled,
      roomId,
      currentDate,
      eventsLen: currentEvents.length,
      selectedDay,
      transpot,
    });
  }, [
    buttonDisabled,
    roomId,
    currentDate,
    currentEvents.length,
    selectedDay,
    transpot,
  ]);

  const onRequestEta = useCallback(() => {
    if (!roomId || !selectedDay || !currentDate) return;

    console.log("🟢 [UI] calc 클릭", {
      roomId,
      selectedDay,
      currentDate,
      transpot,
    });

    // 1) 원본에서 순서 기준 산출: 명시적 순서가 있으면 그걸 우선, 없으면 배열 인덱스
    const withOrder = [...currentEvents]
      .filter((e) => e?.wantId != null)
      .map((e, idx) => ({
        ...e,
        __idx: idx,
        __ord:
          e?.eventOrder ??
          e?.order ??
          e?.seq ??
          e?.index ??
          e?.position ??
          idx + 1, // 배열 순서 기반 1-based
      }))
      // 2) 정렬: 명시적 순서 우선, 동률이면 원래 배열 순서 유지
      .sort((a, b) => a.__ord - b.__ord || a.__idx - b.__idx);

    // 3) 최종 payload: 서버 친화적으로 eventOrder를 1..N으로 재보정(연속 보장)
    const payloadEvents = withOrder.map((e, i) => ({
      wantId: Number(e.wantId),
      eventOrder: i + 1,
      ...(e.startTime ? { startTime: e.startTime } : {}),
      ...(e.endTime ? { endTime: e.endTime } : {}),
    }));

    console.log("🟢 [UI] publish 직전", {
      eventsLen: payloadEvents.length,
      first2: payloadEvents.slice(0, 2),
    });

    publishTravel(
      {
        roomId,
        nameId: `day-${selectedDay}`,
        day: selectedDay,
        date: currentDate,
        transpot, // 'driving' | 'transit'
        events: payloadEvents,
      },
      { senderId: userEmail }
    );
  }, [roomId, selectedDay, currentDate, currentEvents, transpot, userEmail]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  useEffect(() => {
    const panel = panelRef.current;
    const handle = headerRef.current;
    if (!panel || !handle) return;

    let dragging = false;
    let dx = 0,
      dy = 0;

    const down = (e) => {
      dragging = true;
      const r = panel.getBoundingClientRect();
      dx = e.clientX - r.left;
      dy = e.clientY - r.top;
      panel.classList.add("dragging");
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
    };
    const move = (e) => {
      if (!dragging) return;
      panel.style.left = `${e.clientX - dx}px`;
      panel.style.top = `${e.clientY - dy}px`;
      panel.style.transform = "none";
      panel.style.position = "fixed";
    };
    const up = () => {
      dragging = false;
      panel.classList.remove("dragging");
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };

    handle.addEventListener("mousedown", down);
    return () => handle.removeEventListener("mousedown", down);
  }, []);

  return (
    <div
      className="itin-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="itin-panel"
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: "translate(-50%, -50%)",
          width: "920px",
          maxWidth: "98vw",
          maxHeight: "96vh",
        }}
      >
        <div className="itin-header" ref={headerRef} title="드래그해서 이동">
          <div className="itin-title">일정 편집</div>

          <div
            className="itin-toolbar"
            style={{ display: "flex", gap: 8, alignItems: "center" }}
          >
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(Number(e.target.value))}
              disabled={buttonDisabled}
              title="계산할 날짜 선택"
              style={{ padding: "4px 6px" }}
            >
              {dayOptions.map((d) => (
                <option key={d.day} value={d.day}>
                  {`Day ${d.day} (${d.date})`}
                </option>
              ))}
            </select>

            <label
              style={{ display: "inline-flex", gap: 4, alignItems: "center" }}
            >
              <input
                type="radio"
                name="transport"
                value="driving"
                checked={transpot === "driving"}
                onChange={() => setTranspot("driving")}
                disabled={buttonDisabled}
              />
              운전
            </label>
            <label
              style={{ display: "inline-flex", gap: 4, alignItems: "center" }}
            >
              <input
                type="radio"
                name="transport"
                value="transit"
                checked={transpot === "transit"}
                onChange={() => setTranspot("transit")}
                disabled={buttonDisabled}
              />
              대중교통
            </label>

            <button
              type="button"
              className="btn primary"
              onClick={onRequestEta}
              disabled={calcDisabled}
              title={
                currentEvents.length < 2
                  ? "두 개 이상 이벤트가 있어야 계산됩니다"
                  : undefined
              }
            >
              {loading ? "계산 중…" : "하루 소요시간 계산"}
            </button>
            <span style={{ opacity: 0.3 }}>|</span>
            <ScheduleSaveButton />
            {error && (
              <span style={{ color: "red", marginLeft: 8 }}>
                {error}
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setError(null)}
                  disabled={loading}
                  style={{ marginLeft: 8 }}
                >
                  닫기
                </button>
              </span>
            )}
          </div>

          <div className="itin-actions">
            <button
              type="button"
              className="btn ghost"
              onClick={() => dispatch(openTripForm())}
            >
              날짜 변경
            </button>
            <button
              type="button"
              className="btn icon"
              aria-label="닫기"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="itin-body">
          <ItineraryBoard transport={transpot} showEta />
        </div>
      </div>
    </div>
  );
}
