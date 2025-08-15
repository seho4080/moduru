// src/features/itinerary/ui/ItineraryBoard.jsx
import React, { useMemo, useState, useEffect, useRef, forwardRef } from "react";
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

// 웹소켓: 스케줄(공통) 동기화
import { connectWebSocket, unsubscribeKeys } from "../../webSocket/coreSocket";
// 웹소켓: 소요시간 계산 발행/결과 구독
import { publishTravel } from "../../webSocket/travelSocket";
// ❗️프로젝트 경로 기준으로 맞춰주세요 (travel 또는 travelTime)
import useTravelResultSocket from "../../travelTime/ui/useTravelResultSocket";
// 상태 스트림(STARTED/DONE 등) 직접 구독해서 '일자별' 로딩 제어
import { subscribeTravelStatus } from "../../webSocket/travelStatusSocket";

// ETA 셀렉터
import { selectLegEta, selectDayTotals } from "../../../redux/slices/etaSlice";

/* ---------------- constants / helpers ---------------- */
const CARD_WIDTH = 240; // 일정 카드 폭 (공유장소와 동일)
const BOARD_COL_WIDTH = 280; // 컬럼 폭(카드 + 여백)

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

  // 결과 채널 구독 → etaSlice에 반영
  useTravelResultSocket(roomId);

  /* ---------- 서버→클라: 시간/버전 동기화 구독 ---------- */
  useEffect(() => {
    if (!roomId) return;
    const key = `itinerary-board|${roomId}|${SCHEDULE_HANDLER}`;

    connectWebSocket(roomId, [
      {
        handler: SCHEDULE_HANDLER,
        key,
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

    return () => unsubscribeKeys([key]);
  }, [roomId, dispatch]);

  /* ---------- 날짜 배열: start/end 있으면 사용, 없으면 daysMap 키 폴백 ---------- */
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
        _id: String(it.entryId), // dnd-kit key
      }));
      byDate[dateKey] = items;
      items.forEach((it, idx) => {
        idToMeta.set(it._id, { dateKey, index: idx, item: it });
      });
    }
    return { byDate, idToMeta };
  }, [dates, daysMap]);

  /* ---------- dnd handlers ---------- */
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

  const activeItem = activeId ? board.idToMeta.get(activeId)?.item : null;

  /* ---------- 일자별 교통수단/로딩/에러 ---------- */
  const [transportByDate, setTransportByDate] = useState({});
  const [loadingByDate, setLoadingByDate] = useState({});
  const [errorByDate, setErrorByDate] = useState({});

  // 날짜 변경 시 기본값 보정
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
    setLoadingByDate((prev) => {
      const next = { ...prev };
      dates.forEach((dk) => {
        if (next[dk] == null) next[dk] = false;
      });
      Object.keys(next).forEach((k) => {
        if (!dates.includes(k)) delete next[k];
      });
      return next;
    });
    setErrorByDate((prev) => {
      const next = { ...prev };
      dates.forEach((dk) => {
        if (next[dk] == null) next[dk] = null;
      });
      Object.keys(next).forEach((k) => {
        if (!dates.includes(k)) delete next[k];
      });
      return next;
    });
  }, [dates, transport]);

  /* ---------- ⏱️ 30초 타임아웃 관리 ---------- */
  const calcTimersRef = useRef({}); // { [dateKey]: timeoutId }

  const startCalcTimeout = (dateKey, ms = 30000) => {
    const prev = calcTimersRef.current[dateKey];
    if (prev) {
      clearTimeout(prev);
      delete calcTimersRef.current[dateKey];
    }
    calcTimersRef.current[dateKey] = setTimeout(() => {
      setLoadingByDate((p) => ({ ...p, [dateKey]: false }));
      if (window?.toast?.warning) window.toast.warning("계산 시간 초과입니다.");
      else if (window?.toast) window.toast("계산 시간 초과입니다.");
      else console.warn("계산 시간 초과입니다.");
      delete calcTimersRef.current[dateKey];
    }, ms);
  };

  const clearCalcTimeout = (dateKey) => {
    const t = calcTimersRef.current[dateKey];
    if (t) {
      clearTimeout(t);
      delete calcTimersRef.current[dateKey];
    }
  };

  const clearAllCalcTimeouts = () => {
    Object.values(calcTimersRef.current).forEach((t) => clearTimeout(t));
    calcTimersRef.current = {};
  };

  useEffect(() => () => clearAllCalcTimeouts(), []);
  useEffect(() => {
    const live = new Set(dates);
    Object.keys(calcTimersRef.current).forEach((dk) => {
      if (!live.has(dk)) clearCalcTimeout(dk);
    });
  }, [dates]);

  /* ---------- 상태 스트림 구독: STARTED/ALREADY_RUNNING/DONE/FAILED ---------- */
  useEffect(() => {
    if (!roomId) return;

    const off = subscribeTravelStatus(roomId, ({ status, body }) => {
      const dayNum = Number(body?.day);
      const dk =
        Number.isFinite(dayNum) && dayNum > 0 ? dates[dayNum - 1] : null;

      switch (status) {
        case "STARTED":
          if (dk) {
            setLoadingByDate((p) => ({ ...p, [dk]: true }));
            setErrorByDate((p) => ({ ...p, [dk]: null }));
            startCalcTimeout(dk); // ⏱️
          }
          break;

        case "ALREADY_RUNNING":
          notify("info", "이미 계산 중입니다.");
          if (dk) {
            setLoadingByDate((p) => ({ ...p, [dk]: true }));
            startCalcTimeout(dk); // ⏱️ 갱신
          }
          break;

        case "DONE":
          if (dk) {
            setLoadingByDate((p) => ({ ...p, [dk]: false }));
            setErrorByDate((p) => ({ ...p, [dk]: null }));
            clearCalcTimeout(dk); // ⏱️
          }
          break;

        case "FAILED":
          if (dk) {
            setLoadingByDate((p) => ({ ...p, [dk]: false }));
            setErrorByDate((p) => ({
              ...p,
              [dk]: body?.message || "소요시간 계산 실패",
            }));
            clearCalcTimeout(dk); // ⏱️
          }
          break;

        default:
          break;
      }
    });

    return off;
  }, [roomId, dates]);

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

    setLoadingByDate((p) => ({ ...p, [dateKey]: true }));
    startCalcTimeout(dateKey); // STARTED가 늦어질 수 있으니 낙관적 시작

    publishTravel({
      roomId,
      day,
      date: dateKey,
      transpot: t, // 서버 호환: transpot
      events,
    });
  };

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
                // SharedPlaceCard 외부 드롭 허용
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
              {/* 컬럼 헤더: 일자 + 교통수단 선택 + 소요시간 계산 버튼 */}
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

                        {/* 카드 사이 ETA (컬럼별 선택 교통수단 기준) */}
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

                  {/* 합계(해당 일자에 2개 이상 장소 있을 때만) */}
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
 * - 사용자가 선택한 transport 최우선
 * - 서버가 transit 대신 walking으로 응답하는 경우 안전 Fallback
 * - 마지막엔 driving도 시도
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
    // 우선순위: 요청 모드 → (transit이면 walking) → driving
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
 * - totals 존재 시 그대로 사용
 * - totals 없으면 해당 모드의 leg 합산으로 폴백
 * - transit 요청인데 walking/driving 값이 오면 그것도 반영
 */
function DayTotals({ day, requestedTransport, cardWidth = CARD_WIDTH }) {
  const data = useSelector((s) => {
    const tryTotals = (t) => selectDayTotals(s, { day, transport: t });

    // 1) 요청 모드 totals
    let t = tryTotals(requestedTransport);
    if (t) {
      return {
        mode: requestedTransport,
        totalDurationMinutes: Number(t.totalDurationMinutes ?? 0),
        totalDistanceMeters: Number(t.totalDistanceMeters ?? 0),
        updatedAt: t.updatedAt ?? null,
      };
    }

    // 2) transit 요청인데 walking totals가 있을 수 있음
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

    // 3) driving totals 폴백
    t = tryTotals("driving");
    if (t) {
      return {
        mode: "driving",
        totalDurationMinutes: Number(t.totalDurationMinutes ?? 0),
        totalDistanceMeters: Number(t.totalDistanceMeters ?? 0),
        updatedAt: t.updatedAt ?? null,
      };
    }

    // 4) totals가 전혀 없을 때 leg 합산 폴백
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
