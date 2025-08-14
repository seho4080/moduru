// src/features/itinerary/ui/ItineraryBoard.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addPlaceToDay,
  moveItemWithin,
  moveItemAcross,
  removeItem,
  setTimes,
} from "../../../redux/slices/itinerarySlice";
import { setDraftVersion } from "../../../redux/slices/scheduleDraftSlice";

import TimeEditor from "./TimeEditor";
import { selectLegEta } from "../../../redux/slices/etaSlice";

// WebSocket 구독
import { subscribeSchedule } from "../../webSocket/scheduleSocket";

export default function ItineraryBoard({
  transport = "driving",
  showEta = true,
}) {
  const dispatch = useDispatch();

  const { startDate, endDate } = useSelector((s) => s.tripRoom ?? {});
  const roomId = useSelector((s) => s.tripRoom?.id ?? s.tripRoom?.roomId);
  const daysMap = useSelector((s) => s.itinerary?.days ?? {});

  // schedule 구독: 방 아이디 기준으로 구독/해제
  useEffect(() => {
    if (!roomId) return;
    console.log("[ItineraryBoard] subscribe schedule for roomId:", roomId);

    const unsub = subscribeSchedule(
      roomId,
      (msg) => {
        console.log("[ItineraryBoard] schedule message received:", msg);
        // 백 DTO 스펙: { roomId, day, date, events: [{ wantId, startTime, endTime, eventOrder }], senderId, draftVersion }
        const { day, date, events, draftVersion } = msg || {};

        // 1) draftVersion은 가드 밖에서 먼저 반영 (버전만 오는 패킷도 처리)
        const dayNum = Number(day);
        const verNum = Number(draftVersion);
        if (Number.isFinite(dayNum) && Number.isFinite(verNum)) {
          dispatch({
            type: setDraftVersion.type,
            payload: { day: dayNum, draftVersion: verNum },
            meta: { fromWs: true }, // ✅ WS 유입 표시
          });
        }

        // 2) 날짜/이벤트 없으면 시간 반영은 생략
        if (!date || !Array.isArray(events)) return;

        // 3) 시간 반영 (wantId 기준)
        events.forEach((ev) => {
          if (!ev?.wantId) return;
          +dispatch({
            type: setTimes.type,
            payload: {
              dateKey: date,
              wantId: ev.wantId,
              startTime: ev.startTime ?? "",
              endTime: ev.endTime ?? "",
            },
            meta: { fromWs: true }, // ✅ WS 유입 표시
          });
        });

        // 필요 시 eventOrder 기반 정렬 반영은 여기에서 프로젝트 규칙에 맞게 구현
      },
      { key: "itinerary-board" }
    );

    return () => {
      try {
        unsub?.();
      } finally {
        console.log(
          "[ItineraryBoard] unsubscribe schedule for roomId:",
          roomId
        );
      }
    };
  }, [roomId, dispatch]);

  const dates = useMemo(() => {
    const out = [];
    if (!startDate) return out;
    const s = new Date(startDate);
    const e = endDate ? new Date(endDate) : s;
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      out.push(`${y}-${m}-${dd}`);
    }
    return out;
  }, [startDate, endDate]);

  return (
    <div className="flex gap-4 overflow-x-auto p-2">
      {dates.map((dateKey, idx) => (
        <DayColumn
          key={dateKey}
          dayNumber={idx + 1}
          dateKey={dateKey}
          items={daysMap[dateKey] || []}
          transport={transport}
          showEta={showEta}
          onAddPlace={(place, index) =>
            dispatch(addPlaceToDay({ date: dateKey, place, index }))
          }
          onReorder={(fromIdx, toIdx) =>
            dispatch(moveItemWithin({ dateKey, fromIdx, toIdx }))
          }
          onMoveAcross={(fromDate, fromIdx, toIdx) =>
            dispatch(
              moveItemAcross({ fromDate, toDate: dateKey, fromIdx, toIdx })
            )
          }
          onRemove={(entryId) => dispatch(removeItem({ dateKey, entryId }))}
          onSetTimes={(entryId, startTime, endTime) =>
            dispatch(setTimes({ dateKey, entryId, startTime, endTime }))
          }
        />
      ))}
    </div>
  );
}

function DayColumn({
  dayNumber,
  dateKey,
  items,
  transport,
  showEta,
  onAddPlace,
  onReorder,
  onMoveAcross,
  onRemove,
  onSetTimes,
}) {
  const listRef = useRef(null);

  const parseDropData = (e) => {
    let json = e.dataTransfer.getData("application/json");
    if (!json) json = e.dataTransfer.getData("text/plain");
    if (!json) return null;
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  };

  // 배경 드롭도 커서 높이 기준으로 정확한 위치 삽입
  const onSectionDrop = (e) => {
    e.preventDefault();
    const data = parseDropData(e);
    if (!data) return;

    // 커서 y 로 insertIndex 계산 (각 카드 중간선 기준)
    let insertIndex = items.length;
    const nodes = listRef.current?.querySelectorAll('[data-entry="card"]');
    if (nodes && nodes.length) {
      const y = e.clientY;
      insertIndex = 0;
      for (let i = 0; i < nodes.length; i++) {
        const rect = nodes[i].getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        if (y > mid) insertIndex = i + 1;
      }
    }

    if (data.type === "PLACE" && data.place) {
      onAddPlace(data.place, insertIndex);
      return;
    }

    if (
      data.type === "ENTRY" &&
      data.entryId &&
      data.fromDate != null &&
      Number.isInteger(data.fromIdx)
    ) {
      if (data.fromDate === dateKey) {
        // 같은 날짜 내 재정렬
        let toIdx = insertIndex;
        if (data.fromIdx < insertIndex) toIdx = insertIndex - 1; // 보정
        if (data.fromIdx !== toIdx) onReorder(data.fromIdx, toIdx);
      } else {
        // 다른 날짜로 이동
        onMoveAcross(data.fromDate, data.fromIdx, insertIndex);
      }
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    try {
      const d = parseDropData(e);
      e.dataTransfer.dropEffect =
        d?.type === "ENTRY" && d?.fromDate === dateKey ? "move" : "copy";
    } catch {
      e.dataTransfer.dropEffect = "copy";
    }
  };

  return (
    <section
      className="w-[360px] flex-shrink-0 rounded-lg border border-slate-200 bg-white"
      onDragOver={onDragOver}
      onDrop={onSectionDrop}
      aria-label={`Day ${dayNumber} ${dateKey}`}
    >
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2">
        <div className="text-sm font-semibold">Day {dayNumber}</div>
        <div className="text-xs text-slate-500">{dateKey}</div>
      </header>

      <div ref={listRef} className="p-2 flex flex-col gap-2">
        {/* 맨 앞 드롭 슬롯 (index 0) */}
        <DropSlot
          ariaLabel="맨 앞에 추가"
          onDropData={(data) => {
            if (data.type === "PLACE" && data.place) onAddPlace(data.place, 0);
            else if (data.type === "ENTRY" && Number.isInteger(data.fromIdx)) {
              if (data.fromDate === dateKey) {
                const toIdx = data.fromIdx < 0 ? 0 : data.fromIdx > 0 ? 0 : 0;
                if (data.fromIdx !== toIdx) onReorder(data.fromIdx, 0);
              } else {
                onMoveAcross(data.fromDate, data.fromIdx, 0);
              }
            }
          }}
        />

        {items.map((it, idx) => (
          <React.Fragment key={`${it.entryId}:${it.eventOrder ?? idx}`}>
            <div
              data-entry="card"
              draggable
              onDragStart={(e) => {
                const body = JSON.stringify({
                  type: "ENTRY",
                  entryId: it.entryId,
                  fromDate: dateKey,
                  fromIdx: idx,
                });
                e.dataTransfer.setData("application/json", body);
                e.dataTransfer.setData("text/plain", body);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const data = parseDropData(e);
                if (!data) return;

                // PLACE: 카드 위/아래 절반 기준 삽입
                if (data.type === "PLACE" && data.place) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const insertIndex =
                    e.clientY < rect.top + rect.height / 2 ? idx : idx + 1;
                  onAddPlace(data.place, insertIndex);
                  e.stopPropagation();
                  return;
                }

                // ENTRY 같은 날짜: 절반 기준 재정렬 (보정 포함)
                if (
                  data.type === "ENTRY" &&
                  data.fromDate === dateKey &&
                  Number.isInteger(data.fromIdx)
                ) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  let insertIndex =
                    e.clientY < rect.top + rect.height / 2 ? idx : idx + 1;
                  if (data.fromIdx < insertIndex) insertIndex -= 1; // 보정
                  if (data.fromIdx !== insertIndex)
                    onReorder(data.fromIdx, insertIndex);
                  e.stopPropagation();
                  return;
                }

                // ENTRY 다른 날짜: 절반 기준으로 교차 이동
                if (
                  data.type === "ENTRY" &&
                  data.fromDate !== dateKey &&
                  Number.isInteger(data.fromIdx)
                ) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const insertIndex =
                    e.clientY < rect.top + rect.height / 2 ? idx : idx + 1;
                  onMoveAcross(data.fromDate, data.fromIdx, insertIndex);
                  e.stopPropagation();
                  return;
                }
              }}
              className="relative flex items-start gap-2 rounded-md border border-slate-200 bg-white p-2"
            >
              <ItineraryCard
                item={it}
                onRemove={() => onRemove(it.entryId)}
                onSetTimes={(s, e) => onSetTimes(it.entryId, s, e)}
              />
            </div>

            {/* 구간(leg) ETA 표시: 현재 카드(it) → 다음 카드(items[idx+1]) */}
            {showEta && items[idx + 1] && (
              <LegETA
                day={dayNumber}
                transport={transport}
                fromId={it.wantId ?? it.placeId}
                toId={items[idx + 1].wantId ?? items[idx + 1].placeId}
              />
            )}

            {/* 카드 뒤 드롭 슬롯 (index: idx+1) */}
            <DropSlot
              ariaLabel={`위치 ${idx + 1} 뒤에 추가`}
              onDropData={(data) => {
                const index = idx + 1;
                if (data.type === "PLACE" && data.place)
                  onAddPlace(data.place, index);
                else if (
                  data.type === "ENTRY" &&
                  Number.isInteger(data.fromIdx)
                ) {
                  if (data.fromDate === dateKey) {
                    let toIdx = index;
                    if (data.fromIdx < index) toIdx = index - 1; // 보정
                    if (data.fromIdx !== toIdx) onReorder(data.fromIdx, toIdx);
                  } else {
                    onMoveAcross(data.fromDate, data.fromIdx, index);
                  }
                }
              }}
            />
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}

function DropSlot({ onDropData, ariaLabel = "여기에 놓기" }) {
  const parseDropData = (e) => {
    let json = e.dataTransfer.getData("application/json");
    if (!json) json = e.dataTransfer.getData("text/plain");
    if (!json) return null;
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(e) => {
        e.preventDefault();
        const data = parseDropData(e);
        if (!data) return;
        onDropData?.(data);
        e.stopPropagation();
      }}
      aria-label={ariaLabel}
      className="h-2 my-1 rounded-sm transition-all"
      style={{
        outline: "1px dashed rgba(100,116,139,.5)",
        outlineOffset: 4,
      }}
    />
  );
}

/** 일정 카드: 제목/카테고리/시간 레이블, 삭제, 시간편집 팝오버 포함 */
function ItineraryCard({ item, onRemove, onSetTimes }) {
  const [open, setOpen] = useState(false);
  const popRef = useRef(null);

  const displayName =
    item?.placeName || item?.name || item?.title || "이름 없음";
  const timeLabel =
    item?.startTime && item?.endTime
      ? `${item.startTime} - ${item.endTime}`
      : item?.startTime
      ? `${item.startTime} - ?`
      : item?.endTime
      ? `? - ${item.endTime}`
      : "시간 미정";

  useEffect(() => {
    const onDocClick = (e) => {
      if (!open) return;
      if (popRef.current && !popRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div className="relative w-full">
      <div className="min-w-0 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-x-2 items-baseline">
            <span className="text-[15px] font-semibold break-words">
              {displayName}
            </span>
            {item?.category && (
              <span className="text-[12px] text-slate-600 break-words">
                {item.category}
              </span>
            )}
          </div>

          <button
            type="button"
            className="mt-1 text-[12px] text-slate-700 underline underline-offset-2"
            onClick={() => setOpen((v) => !v)}
            title="시간 편집"
          >
            {timeLabel}
          </button>
        </div>

        <button
          type="button"
          className="ml-auto h-6 w-6 rounded-full border border-slate-300 text-[12px] font-bold leading-none"
          onClick={onRemove}
          aria-label="삭제"
          title="삭제"
        >
          ×
        </button>
      </div>

      {open && (
        <div ref={popRef} className="absolute right-0 top-8 z-10">
          <TimeEditor
            initialStart={item?.startTime ?? ""}
            initialEnd={item?.endTime ?? ""}
            onConfirm={({ startTime, endTime }) => {
              onSetTimes?.(startTime, endTime);
              setOpen(false);
            }}
            onCancel={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

function LegETA({ day, transport, fromId, toId }) {
  const eta = useSelector((s) =>
    selectLegEta(s, {
      day,
      transport, // "driving" | "transit" | "walking"
      fromWantId: Number(fromId),
      toWantId: Number(toId),
    })
  );

  if (!eta) {
    return (
      <div
        className="mx-2 my-1 rounded bg-slate-50 text-slate-500 text-xs px-2 py-1 border border-slate-200"
        title="소요시간 계산 결과 대기 중"
      >
        {transport} · 계산 대기
      </div>
    );
  }

  const min = Math.round(eta.durationMinutes ?? 0); // 분 단위
  const km =
    eta.distanceMeters != null ? (eta.distanceMeters / 1000).toFixed(1) : null;

  return (
    <div
      className="mx-2 my-1 rounded bg-indigo-50 text-indigo-700 text-xs px-2 py-1 border border-indigo-200"
      title={`업데이트: ${eta.updatedAt ?? "-"}`}
    >
      {transport} · {min}분{km ? ` · ${km}km` : ""}
    </div>
  );
}
