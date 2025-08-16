// src/features/itinerary/ui/ItineraryBoard.jsx
import React, { useMemo, useState, useEffect, forwardRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addPlaceToDay,
  moveItemWithin,
  moveItemAcross,
  removeItem,
  setTimes,
  replaceDayFromServer,
} from "../../../redux/slices/itinerarySlice";
import { setDraftVersion } from "../../../redux/slices/scheduleDraftSlice";

import {
  DndContext,
  DragOverlay,
  pointerWithin,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

import SharedPlaceCard from "../../sharedPlace/ui/SharedPlaceCard";

// 코어 소켓: 공통 구독/발행 어댑터
import { connectWebSocket, unsubscribeKeys } from "../../webSocket/coreSocket";

// 경로 계산: 발행/결과 구독
import {
  publishTravel,
  subscribeTravel,
  getLastRequestedTransport,
} from "../../webSocket/travelSocket";

// ETA 업서트 액션
import { upsertDayEtas, upsertDayTotals } from "../../../redux/slices/etaSlice";

// 상태/타임아웃 관리 훅 (travel/status 단일 토픽 구독)
import useCalcStatusByDate from "./useCalcStatusByDate";

// 분리된 컴포넌트 & 유틸
import ColumnDroppable from "./components/ColumnDroppable";
import SortableItineraryCard from "./components/SortableItineraryCard";
import LegETA from "./components/LegETA";
import DayTotals from "./components/DayTotals";
import TransportRadio from "./components/TransportRadio";
import { computeInsertIndexInColumn, getActiveCenterY } from "./dndUtils";

/* ---------------- constants / helpers ---------------- */
const CARD_WIDTH = 240;
const BOARD_COL_WIDTH = 280;

const SCHEDULE_HANDLER = "schedule";
const EMPTY_OBJ = Object.freeze({});
const EMPTY_ARR = Object.freeze([]);

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

  /* ---------- 계산 상태/에러/타임아웃 (status 구독은 훅이 담당) ---------- */
  const {
    loadingByDate,
    errorByDate,
    markOwnRequestAndStart,
    markResolvedFromResult, // ✅ DONE 누락 대비
  } = useCalcStatusByDate(roomId, dates, { notify });

  /* ---------- travel/result 구독 + schedule 동기화 ---------- */
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
            dispatch({
              type: replaceDayFromServer.type,
              payload: { dateKey: date, events },
              meta: { fromWs: true },
            });
          }
        },
      },
    ]);

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
                          cardWidth={CARD_WIDTH}
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

export default ItineraryBoard;
