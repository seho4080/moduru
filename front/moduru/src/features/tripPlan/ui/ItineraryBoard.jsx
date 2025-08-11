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

/**
 * 보드: 여행 날짜 구간(startDate~endDate)을 열로 표시하고,
 * 외부 장소 드롭/같은 날짜 내 재정렬/다른 날짜로 이동/시간 편집/삭제를 지원한다.
 * - 외부 드롭 payload: { type: "PLACE", place }
 * - 내부 카드 드래그 payload: { type: "ENTRY", entryId, fromDate, fromIdx }
 */
export default function ItineraryBoard() {
  const dispatch = useDispatch();
  const { startDate, endDate } = useSelector((s) => s.tripRoom ?? {});
  const daysMap = useSelector((s) => s.itinerary?.days ?? {});

  // YYYY-MM-DD 배열 생성
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
          onAddPlace={(place) =>
            dispatch(addPlaceToDay({ date: dateKey, place }))
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

/** 날짜 열: 외부 드롭(추가), 같은 날짜 내 재정렬, 다른 날짜로 이동을 처리한다. */
function DayColumn({
  dayNumber,
  dateKey,
  items,
  onAddPlace,
  onReorder,
  onMoveAcross,
  onRemove,
  onSetTimes,
}) {
  const dragFrom = useRef(null); // 같은 날짜 내 드래그 시작 인덱스 저장

  // 드롭 데이터 파싱 유틸: application/json → 없으면 text/plain 시도
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

  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    try {
      const json = e.dataTransfer.getData("application/json");
      const data = json && JSON.parse(json);
      if (data?.type === "ENTRY" && data.fromDate === dateKey) {
        e.dataTransfer.dropEffect = "move"; // 같은 날짜 이동
      } else {
        e.dataTransfer.dropEffect = "copy"; // 외부 추가
      }
    } catch {
      e.dataTransfer.dropEffect = "copy";
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    const data = parseDropData(e);
    if (!data) return;

    // 외부(PLACE) 드롭: 해당 날짜 맨 끝에 추가
    if (data.type === "PLACE" && data.place) {
      onAddPlace(data.place);
      return;
    }

    // 내부 카드(ENTRY) 드롭
    if (
      data.type === "ENTRY" &&
      data.entryId &&
      data.fromDate != null &&
      Number.isInteger(data.fromIdx)
    ) {
      if (data.fromDate === dateKey) {
        // 같은 날짜에서 "열 배경"으로 드롭하면 맨 끝으로 이동
        onReorder(data.fromIdx, items.length);
        return;
      }
      // 다른 날짜로 이동: 위치 지정 없으면 맨 끝
      onMoveAcross(data.fromDate, data.fromIdx, undefined);
    }
  };

  return (
    <section
      className="w-[360px] flex-shrink-0 rounded-lg border border-slate-200 bg-white"
      onDragOver={onDragOver}
      onDrop={onDrop}
      aria-label={`Day ${dayNumber} ${dateKey}`}
    >
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2">
        <div className="text-sm font-semibold">Day {dayNumber}</div>
        <div className="text-xs text-slate-500">{dateKey}</div>
      </header>

      <div className="p-2 flex flex-col gap-2">
        {items.length === 0 && (
          <div className="h-24 rounded-md border border-dashed border-slate-300 text-slate-400 text-sm flex items-center justify-center">
            여기로 드래그하여 담을 수 있습니다
          </div>
        )}

        {items.map((it, idx) => (
          <div
            key={it.entryId}
            draggable
            onDragStart={(e) => {
              const body = JSON.stringify({
                type: "ENTRY",
                entryId: it.entryId,
                fromDate: dateKey,
                fromIdx: idx,
              });
              e.dataTransfer.setData("application/json", body);
              e.dataTransfer.setData("text/plain", body); // 호환용
              e.dataTransfer.effectAllowed = "move";
              dragFrom.current = idx;
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const data = parseDropData(e);
              if (!data) return;

              // 카드 위에 PLACE 드롭 → 추가 허용 (필요시 특정 위치 삽입으로 확장 가능)
              if (data.type === "PLACE" && data.place) {
                onAddPlace(data.place);
                e.stopPropagation(); // 부모 섹션 onDrop 중복 처리 방지
                return;
              }

              // 같은 날짜 내 재정렬
              const fromIdx = dragFrom.current;
              if (
                data.type === "ENTRY" &&
                data.fromDate === dateKey &&
                fromIdx != null &&
                fromIdx !== idx
              ) {
                onReorder(fromIdx, idx);
              }
              e.stopPropagation(); // 부모 섹션 onDrop 실행 방지
              dragFrom.current = null;
            }}
          >
            <ItineraryCard
              item={it}
              onRemove={() => onRemove(it.entryId)}
              onSetTimes={(s, e) => onSetTimes(it.entryId, s, e)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

/** HH:MM 24h 검증 */
const isHHMM = (v) =>
  typeof v === "string" &&
  /^\d{2}:\d{2}$/.test(v) &&
  Number(v.slice(0, 2)) < 24 &&
  Number(v.slice(3, 5)) < 60;

/** 인라인 시간 편집 팝오버 */
function TimeEditor({ initialStart, initialEnd, onConfirm, onCancel }) {
  const [start, setStart] = useState(initialStart ?? "");
  const [end, setEnd] = useState(initialEnd ?? "");
  const valid = (!start || isHHMM(start)) && (!end || isHHMM(end));

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="rounded-md border border-slate-200 bg-white p-2 shadow-md">
      <div className="flex items-center gap-2">
        <label className="text-xs w-14">시작</label>
        <input
          type="time"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <label className="text-xs w-14">종료</label>
        <input
          type="time"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          className="px-3 py-1 text-sm border rounded"
          onClick={onCancel}
        >
          취소
        </button>
        <button
          type="button"
          className="px-3 py-1 text-sm rounded bg-blue-600 text-white disabled:opacity-50"
          disabled={!valid}
          onClick={() =>
            onConfirm?.({ startTime: start || null, endTime: end || null })
          }
        >
          적용
        </button>
      </div>
    </div>
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
    <div className="relative flex items-start gap-2 rounded-md border border-slate-200 bg-white p-2">
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
