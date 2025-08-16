// src/features/itinerary/ui/ItineraryBoard.jsx
import React, { useMemo, useState, useEffect, forwardRef } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import {
  addPlaceToDay,
  moveItemWithin,
  moveItemAcross,
  removeItem,
  setTimes,
} from "../../../redux/slices/itinerarySlice";
import { setDraftVersion } from "../../../redux/slices/scheduleDraftSlice";
import SharedPlaceCard from "../../sharedPlace/ui/SharedPlaceCard";

import {
  DndContext,
  DragOverlay,
  pointerWithin,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// 코어 소켓: 공통 구독/발행 어댑터
import { connectWebSocket, unsubscribeKeys } from "../../webSocket/coreSocket";

// 경로 계산: 발행/결과 구독
import {
  publishTravel,
  subscribeTravel,
  getLastRequestedTransport,
} from "../../webSocket/travelSocket";

// ETA 셀렉터/업서트
import {
  selectLegEta,
  selectDayTotals,
  upsertDayEtas,
  upsertDayTotals,
} from "../../../redux/slices/etaSlice";

// 계산 상태/타임아웃/문구 관리 훅(내부에서 travel/status 구독)
import useCalcStatusByDate from "./useCalcStatusByDate";

/* ---------------- constants / helpers ---------------- */
const CARD_WIDTH = 240;
const BOARD_COL_WIDTH = 280;

const SCHEDULE_HANDLER = "schedule";
const EMPTY_OBJ = Object.freeze({});
const EMPTY_ARR = Object.freeze([]);

const TRANSPORT_LABEL = {
  driving: "운전",
  transit: "대중교통",
  walking: "도보",
  null: "미지정",
};

function labelOf(m) {
  return TRANSPORT_LABEL[m ?? "null"] || "미지정";
}

function notify(type, message) {
  if (window?.toast?.[type]) window.toast[type](message);
  else if (window?.toast) window.toast(message);
  else if (type === "error") alert(message);
  else console.log(`[${type}] ${message}`);
}

/* ===================================================== */

const ItineraryBoard = forwardRef(function ItineraryBoard(
  { transport = "driving", showEta = true },
  ref
) {
  const dispatch = useDispatch();

  const startDate = useSelector((s) => s.tripRoom?.startDate);
  const endDate = useSelector((s) => s.tripRoom?.endDate);
  const roomId = useSelector((s) => s.tripRoom?.id ?? s.tripRoom?.roomId);
  const daysMap = useSelector((s) => s.itinerary?.days) || EMPTY_OBJ;

  /* ---------- 날짜 배열 ---------- */
  const dates = useMemo(() => {
    const out = [];
    if (startDate) {
      const s = new Date(startDate);
      const e = endDate ? new Date(endDate) : s;
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        out.push(`${y}-${m}-${dd}`);
      }
      return out;
    }
    const keys = Object.keys(daysMap || {}).filter(Boolean);
    keys.sort((a, b) => String(a).localeCompare(String(b)));
    return keys;
  }, [startDate, endDate, daysMap]);

  /* ---------- dnd-kit ---------- */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const board = useMemo(() => {
    const byDate = {};
    const idToMeta = new Map();
    for (const dateKey of dates) {
      const items = (daysMap[dateKey] || EMPTY_ARR).map((it) => ({
        ...it,
        _id: String(it.entryId),
      }));
      byDate[dateKey] = items;
      items.forEach((it, idx) => {
        idToMeta.set(it._id, { dateKey, index: idx, item: it });
      });
    }
    return { byDate, idToMeta };
  }, [dates, daysMap]);

  const [activeId, setActiveId] = useState(null);
  const handleDragStart = (event) => setActiveId(String(event.active.id));

  const getActiveCenterY = (active) => {
    const r = active?.rect?.current;
    if (!r) return null;
    const top = r.translated?.top ?? r.top ?? r.initial?.top ?? null;
    const height = r.rect?.height ?? r.initial?.height ?? 0;
    if (top == null) return null;
    return top + height / 2;
  };

  const computeInsertIndexInColumn = (dateKey, pointerY) => {
    const container = document.querySelector(`[data-col="${dateKey}"]`);
    const nodes = container?.querySelectorAll(
      `[data-entry="card"][data-date="${dateKey}"]`
    );
    const len = nodes?.length ?? 0;
    if (!len) return 0;
    for (let i = 0; i < len; i++) {
      const rect = nodes[i].getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (pointerY < mid) return i;
    }
    return len;
  };

  const getTargetPosition = (overId) => {
    if (!overId) return null;
    const id = String(overId);
    if (id.startsWith("col:")) {
      const dk = id.slice(4);
      return { dateKey: dk, index: null, isContainer: true };
    }
    if (board.idToMeta.has(id)) {
      const meta = board.idToMeta.get(id);
      return { dateKey: meta.dateKey, index: meta.index, isContainer: false };
    }
    return null;
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    const activeIdStr = String(active?.id || "");
    const overIdStr = over ? String(over.id) : null;

    setActiveId(null);
    if (!activeIdStr || !overIdStr) return;
    if (!board.idToMeta.has(activeIdStr)) return;

    const from = board.idToMeta.get(activeIdStr);
    const to = getTargetPosition(overIdStr);
    if (!to) return;

    const fromDate = from.dateKey;
    const toDate = to.dateKey;

    // 같은 컬럼: 빈공간 드롭 → 포인터 기준 삽입
    if (fromDate === toDate && to.isContainer) {
      const pointerY = getActiveCenterY(active);
      const insertPos =
        pointerY == null
          ? (board.byDate[toDate] || EMPTY_ARR).length
          : computeInsertIndexInColumn(toDate, pointerY);
      const finalIndex = from.index < insertPos ? insertPos - 1 : insertPos;
      if (from.index !== finalIndex) {
        dispatch(
          moveItemWithin({
            dateKey: fromDate,
            fromIdx: from.index,
            toIdx: finalIndex,
          })
        );
      }
      return;
    }

    // 같은 컬럼: 카드 위로 드롭
    if (fromDate === toDate) {
      let toIndex = to.index;
      if (over?.rect && active?.rect && !to.isContainer) {
        const midY = over.rect.top + over.rect.height / 2;
        if (active.rect.current.translated?.top > midY) toIndex = to.index + 1;
      }
      const finalIndex = from.index < toIndex ? toIndex - 1 : toIndex;
      if (from.index !== finalIndex) {
        dispatch(
          moveItemWithin({
            dateKey: fromDate,
            fromIdx: from.index,
            toIdx: finalIndex,
          })
        );
      }
      return;
    }

    // 다른 컬럼으로 이동
    const pointerY = getActiveCenterY(active);
    let insertIndex;
    if (to.isContainer) {
      insertIndex =
        pointerY == null
          ? (board.byDate[toDate] || EMPTY_ARR).length
          : computeInsertIndexInColumn(toDate, pointerY);
    } else {
      insertIndex = to.index;
      if (over?.rect && active?.rect) {
        const midY = over.rect.top + over.rect.height / 2;
        if (active.rect.current.translated?.top > midY)
          insertIndex = to.index + 1;
      }
    }

    dispatch(
      moveItemAcross({
        fromDate: fromDate,
        toDate: toDate,
        fromIdx: from.index,
        toIdx: insertIndex,
      })
    );
  };

  /* ---------- 일자별 교통수단 ---------- */
  const [transportByDate, setTransportByDate] = useState({});
  useEffect(() => {
    setTransportByDate((prev) => {
      const next = { ...prev };
      dates.forEach((dk) => {
        if (!next[dk]) next[dk] = transport;
      });
      Object.keys(next).forEach((k) => {
        if (!dates.includes(k)) delete next[k];
      });
      return next;
    });
  }, [dates, transport]);

  /* ---------- 계산 상태/에러/타임아웃 (status 구독은 이 훅이 담당) ---------- */
  const {
    loadingByDate,
    errorByDate,
    markOwnRequestAndStart,
    markResolvedFromResult, // ✅ DONE 누락 대비
  } = useCalcStatusByDate(roomId, dates, { notify });

  /* ---------- schedule/result 구독 (status는 위 훅이 먼저 구독됨) ---------- */
  useEffect(() => {
    if (!roomId) return;

    // 1) travel/result → etaSlice 반영
    const offResult = subscribeTravel(
      roomId,
      (body) => {
        if (!body) return;

        const {
          day,
          transport,
          totalDistanceMeters,
          totalDurationMinutes,
          legs,
          updatedAt,
        } = body;

        const dayNum = Number(day);
        if (!Number.isFinite(dayNum)) return;

        // transport: 응답값 → 마지막 요청 모드 → transit
        let t =
          (typeof transport === "string" && transport) ||
          getLastRequestedTransport(roomId, dayNum) ||
          "transit";
        t = String(t).toLowerCase();
        if (t === "driver") t = "driving";

        // legs 반영
        if (Array.isArray(legs) && legs.length > 0) {
          const items = legs.map((l) => ({
            fromWantId: Number(l.fromWantId ?? l.fromId),
            toWantId: Number(l.toWantId ?? l.toId),
            distanceMeters: Number(l.distanceMeters ?? l.distance ?? 0),
            durationMinutes: Number(l.durationMinutes ?? l.duration ?? 0),
            updatedAt: l.updatedAt ?? updatedAt,
          }));
          dispatch(upsertDayEtas({ day: dayNum, transport: t, items }));
        }

        // totals만 와도 반영
        if (
          typeof totalDistanceMeters === "number" &&
          typeof totalDurationMinutes === "number"
        ) {
          dispatch(
            upsertDayTotals({
              day: dayNum,
              transport: t,
              totalDistanceMeters,
              totalDurationMinutes,
              updatedAt,
            })
          );
        }

        // ✅ DONE 누락 대비: result 수신만으로도 로딩 해제
        markResolvedFromResult(body);
      },
      { key: "travel-result/board" }
    );

    // 2) schedule 동기화
    const scheduleKey = `itinerary-board|${roomId}|${SCHEDULE_HANDLER}`;
    connectWebSocket(roomId, [
      {
        handler: SCHEDULE_HANDLER,
        key: scheduleKey,
        callback: (msg) => {
          const { day, date, events, draftVersion } = msg || {};

          const dayNum = Number(day);
          const verNum = Number(draftVersion);
          if (Number.isFinite(dayNum) && Number.isFinite(verNum)) {
            dispatch({
              type: setDraftVersion.type,
              payload: { day: dayNum, draftVersion: verNum },
              meta: { fromWs: true },
            });
          }

          if (date && Array.isArray(events)) {
            events.forEach((ev) => {
              if (!ev?.wantId) return;
              dispatch({
                type: setTimes.type,
                payload: {
                  dateKey: date,
                  wantId: ev.wantId,
                  startTime: ev.startTime ?? "",
                  endTime: ev.endTime ?? "",
                },
                meta: { fromWs: true },
              });
            });
          }
        },
      },
    ]);

    // cleanup: 컴포넌트 언마운트/roomId 변경 시
    return () => {
      offResult();
      unsubscribeKeys([scheduleKey]);
    };
  }, [roomId, dispatch, markResolvedFromResult]);

  /* ---------- 네이티브 드롭 파싱 ---------- */
  function parseDropData(e) {
    let json = null;
    try {
      json = e.dataTransfer?.getData("application/json");
      if (!json) json = e.dataTransfer?.getData("text/plain");
    } catch {}
    if (!json) return null;
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  /* ---------- 소요시간 계산 요청(일자별) ---------- */
  const requestCalcForDate = (dateKey) => {
    if (!roomId) return;
    const items = board.byDate[dateKey] || EMPTY_ARR;
    if (items.length < 2) {
      notify("info", "이동 경로가 2개 이상일 때만 계산됩니다.");
      return;
    }
    const t = transportByDate[dateKey] || "driving";
    const day = dates.indexOf(dateKey) + 1;

    const events = items.map((it, i) => ({
      wantId: it.wantId ?? it.placeId,
      eventOrder: i + 1,
      startTime: it.startTime || undefined,
      endTime: it.endTime || undefined,
    }));

    // 내 요청 표시 + 낙관적 로딩 + 타임아웃 시작
    markOwnRequestAndStart(dateKey);

    // 발행
    publishTravel({
      roomId,
      day,
      date: dateKey,
      transpot: t, // 서버 레거시 호환 키
      events,
    });
  };

  const activeItem = activeId ? board.idToMeta.get(activeId)?.item : null;

  /* ---------- render ---------- */
  return (
    <div
      ref={ref}
      id="itinerary-board-root"
      className="flex gap-4 overflow-x-auto p-2"
    >
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {dates.map((dateKey, idx) => {
          const items = board.byDate[dateKey] || EMPTY_ARR;
          const t = transportByDate[dateKey] || "driving";
          const loading = !!loadingByDate[dateKey];
          const errMsg = errorByDate[dateKey];

          return (
            <section
              key={dateKey}
              className="flex-shrink-0 rounded-lg border border-slate-200 bg-white"
              style={{ width: BOARD_COL_WIDTH }}
              aria-label={`Day ${idx + 1} ${dateKey}`}
              onDragOver={(e) => {
                e.preventDefault();
                try {
                  const json = e.dataTransfer?.getData("application/json");
                  if (json) e.dataTransfer.dropEffect = "copy";
                } catch {}
              }}
              onDrop={(e) => {
                e.preventDefault();
                const data = parseDropData(e);
                if (data?.type === "PLACE" && data?.place) {
                  const clientY = e.clientY ?? null;
                  let insertIndex = items.length;
                  if (clientY != null) {
                    insertIndex = computeInsertIndexInColumn(dateKey, clientY);
                  }
                  dispatch(
                    addPlaceToDay({
                      date: dateKey,
                      place: data.place,
                      index: insertIndex,
                    })
                  );
                }
              }}
            >
              {/* 헤더 */}
              <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold">Day {idx + 1}</div>
                    <div className="text-xs text-slate-500">{dateKey}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <TransportRadio
                      name={`transport-${dateKey}`}
                      value={t}
                      disabled={loading}
                      onChange={(val) =>
                        setTransportByDate((prev) => ({
                          ...prev,
                          [dateKey]: val,
                        }))
                      }
                    />
                    <button
                      type="button"
                      className={`text-xs rounded border px-2 py-1 ${
                        loading
                          ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                          : "bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700"
                      }`}
                      onClick={() => requestCalcForDate(dateKey)}
                      disabled={loading}
                      aria-busy={loading}
                    >
                      {loading ? "계산 중..." : "계산"}
                    </button>
                  </div>
                </div>

                {errMsg ? (
                  <div className="mt-1 text-[11px] text-red-600">{errMsg}</div>
                ) : null}
              </header>

              <ColumnDroppable dateKey={dateKey}>
                <div
                  className="p-2 flex flex-col items-center gap-2 min-h-[80px]"
                  data-col={dateKey}
                >
                  <SortableContext
                    items={items.map((it) => it._id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {items.map((it, itemIdx) => (
                      <React.Fragment key={it._id}>
                        <SortableItineraryCard
                          item={it}
                          dateKey={dateKey}
                          onRemove={() =>
                            dispatch(
                              removeItem({ dateKey, entryId: it.entryId })
                            )
                          }
                          onConfirmTimes={(s, e) =>
                            dispatch(
                              setTimes({
                                dateKey,
                                entryId: it.entryId,
                                startTime: s,
                                endTime: e,
                              })
                            )
                          }
                        />

                        {/* 카드 사이 ETA */}
                        {showEta && items[itemIdx + 1] && (
                          <LegETA
                            day={idx + 1}
                            requestedTransport={t}
                            fromId={it.wantId ?? it.placeId}
                            toId={
                              items[itemIdx + 1].wantId ??
                              items[itemIdx + 1].placeId
                            }
                            cardWidth={CARD_WIDTH}
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </SortableContext>

                  {/* 일차 합계 */}
                  {showEta &&
                    items.filter((x) =>
                      Number.isFinite(Number(x.wantId ?? x.placeId ?? x.id))
                    ).length >= 2 && (
                      <DayTotals
                        day={idx + 1}
                        requestedTransport={t}
                        cardWidth={CARD_WIDTH}
                      />
                    )}
                </div>
              </ColumnDroppable>
            </section>
          );
        })}

        <DragOverlay>
          {activeItem ? (
            <div className="relative" style={{ width: CARD_WIDTH }}>
              <SharedPlaceCard
                place={activeItem}
                showVote={false}
                showAddress={false}
                isDraggable={false}
                enableTimePopover={false}
                cardWidth={CARD_WIDTH}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
});

/* ---------------- small components ---------------- */

function ColumnDroppable({ dateKey, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${dateKey}` });
  return (
    <div
      ref={setNodeRef}
      className={isOver ? "outline outline-2 outline-indigo-300" : ""}
      style={{ minHeight: 24 }}
    >
      {children}
    </div>
  );
}

function SortableItineraryCard({ item, dateKey, onRemove, onConfirmTimes }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: isDragging ? "grabbing" : "grab",
    opacity: isDragging ? 0.85 : 1,
    width: CARD_WIDTH,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative"
      data-entry="card"
      data-date={dateKey}
      {...attributes}
      {...listeners}
    >
      <SharedPlaceCard
        place={item}
        showVote={false}
        showAddress={false}
        isDraggable={false}
        enableTimePopover
        startTime={item?.startTime ?? ""}
        endTime={item?.endTime ?? ""}
        onConfirmTimes={(s, e) => onConfirmTimes?.(s, e)}
        onRemove={onRemove}
        cardWidth={CARD_WIDTH}
      />
    </div>
  );
}

/**
 * 구간 ETA 렌더러:
 * - 요청 모드 최우선
 * - transit 응답이 walking으로 올 수 있어 안전 Fallback
 * - 마지막엔 driving 폴백
 */
function LegETA({
  day,
  requestedTransport,
  fromId,
  toId,
  cardWidth = CARD_WIDTH,
}) {
  const fromWantId = Number(fromId);
  const toWantId = Number(toId);

  const data = useSelector((s) => {
    const tryPick = (t) =>
      selectLegEta(s, { day, transport: t, fromWantId, toWantId });
    let hit = tryPick(requestedTransport);
    if (!hit && requestedTransport === "transit") hit = tryPick("walking");
    if (!hit) hit = tryPick("driving");
    return hit
      ? {
          mode: requestedTransport,
          durationMinutes: Number(hit.durationMinutes ?? 0),
          distanceMeters: Number(hit.distanceMeters ?? 0),
          updatedAt: hit.updatedAt ?? null,
        }
      : null;
  }, shallowEqual);

  if (!data) {
    return (
      <div
        className="text-xs px-2 py-1 border rounded bg-slate-50 text-slate-500 border-slate-200"
        style={{ width: cardWidth }}
        title="소요시간 계산 결과 대기 중"
      >
        {labelOf(requestedTransport)} · 계산 대기
      </div>
    );
  }

  const min = Math.round(data.durationMinutes);
  const km =
    data.distanceMeters != null
      ? (data.distanceMeters / 1000).toFixed(1)
      : null;

  return (
    <div
      className="text-xs px-2 py-1 border rounded bg-indigo-50 text-indigo-700 border-indigo-200"
      style={{ width: cardWidth }}
      title={`업데이트: ${data.updatedAt ?? "-"}`}
    >
      {labelOf(requestedTransport)} · {min}분{km ? ` · ${km}km` : ""}
    </div>
  );
}

/**
 * 일차 합계:
 * - totals 우선
 * - 없으면 해당 모드 legs 합산
 * - transit 요청인데 walking/driving만 와도 반영
 */
function DayTotals({ day, requestedTransport, cardWidth = CARD_WIDTH }) {
  const data = useSelector((s) => {
    const tryTotals = (t) => selectDayTotals(s, { day, transport: t });

    let t = tryTotals(requestedTransport);
    if (t) {
      return {
        mode: requestedTransport,
        totalDurationMinutes: Number(t.totalDurationMinutes ?? 0),
        totalDistanceMeters: Number(t.totalDistanceMeters ?? 0),
        updatedAt: t.updatedAt ?? null,
      };
    }

    if (requestedTransport === "transit") {
      t = tryTotals("walking");
      if (t) {
        return {
          mode: "walking",
          totalDurationMinutes: Number(t.totalDurationMinutes ?? 0),
          totalDistanceMeters: Number(t.totalDistanceMeters ?? 0),
          updatedAt: t.updatedAt ?? null,
        };
      }
    }

    t = tryTotals("driving");
    if (t) {
      return {
        mode: "driving",
        totalDurationMinutes: Number(t.totalDurationMinutes ?? 0),
        totalDistanceMeters: Number(t.totalDistanceMeters ?? 0),
        updatedAt: t.updatedAt ?? null,
      };
    }

    const modesToTry =
      requestedTransport === "transit"
        ? ["transit", "walking", "driving"]
        : [requestedTransport, "driving"];
    for (const m of modesToTry) {
      let dur = 0,
        dist = 0,
        any = false;
      const prefix = `day:${day}|${m}|`;
      for (const [k, v] of Object.entries(s.eta?.byLeg || {})) {
        if (k.startsWith(prefix)) {
          dur += Number(v.durationMinutes || 0);
          dist += Number(v.distanceMeters || 0);
          any = true;
        }
      }
      if (any) {
        return {
          mode: m,
          totalDurationMinutes: dur,
          totalDistanceMeters: dist,
          updatedAt: null,
        };
      }
    }
    return null;
  }, shallowEqual);

  if (!data) return null;

  const km =
    data.totalDistanceMeters != null
      ? (data.totalDistanceMeters / 1000).toFixed(1)
      : null;
  const min = Math.round(data.totalDurationMinutes ?? 0);

  return (
    <div
      className="mt-1 text-xs px-2 py-1 border rounded bg-emerald-50 text-emerald-700 border-emerald-200"
      style={{ width: cardWidth }}
      title={`업데이트: ${data.updatedAt ?? "-"}`}
    >
      합계 · {labelOf(data.mode)} · {min}분{km ? ` · ${km}km` : ""}
    </div>
  );
}

// 교통수단 라디오 (운전/대중교통)
function TransportRadio({ value, onChange, disabled, name = "transport" }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <label className="inline-flex items-center gap-1">
        <input
          type="radio"
          name={name}
          value="driving"
          checked={value === "driving"}
          onChange={() => onChange?.("driving")}
          disabled={disabled}
        />
        <span>운전</span>
      </label>
      <label className="inline-flex items-center gap-1">
        <input
          type="radio"
          name={name}
          value="transit"
          checked={value === "transit"}
          onChange={() => onChange?.("transit")}
          disabled={disabled}
        />
        <span>대중교통</span>
      </label>
    </div>
  );
}

export default ItineraryBoard;
