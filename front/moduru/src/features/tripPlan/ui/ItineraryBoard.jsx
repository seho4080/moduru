import React, {
  useMemo,
  useState,
  useEffect,
  forwardRef,
  useCallback,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addPlaceToDay,
  moveItemWithin,
  moveItemAcross,
  removeItem,
  setTimes,
  replaceDayFromServer,
  setOrderForDate,
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
import { connectWebSocket, unsubscribeKeys } from "../../webSocket/coreSocket";
import {
  publishTravel,
  subscribeTravel,
  getLastRequestedTransport,
} from "../../webSocket/travelSocket";
import { publishSchedule } from "../../webSocket/scheduleSocket";
import { upsertDayEtas, upsertDayTotals } from "../../../redux/slices/etaSlice";
import useCalcStatusByDate from "./useCalcStatusByDate";

import ColumnDroppable from "./components/ColumnDroppable";
import SortableItineraryCard from "./components/SortableItineraryCard";
import LegETA from "./components/LegETA";
import DayTotals from "./components/DayTotals";
import TransportRadio from "./components/TransportRadio";
import { computeInsertIndexInColumn, getActiveCenterY } from "./dndUtils";

import AiRouteDayModalButton from "../../aiRoute/ui/AiRouteDayModalButton";

/* ---------------- constants / helpers ---------------- */
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
  {
    transport = "driving",
    showEta = true,
    boardWidth = 280, // 🔸 보드 폭 prop 추가
    visibleBoards = 3, // 🔸 표시할 보드 수 prop 추가
    panelType = "side", // 🔸 패널 타입 prop 추가
  },
  ref
) {
  const dispatch = useDispatch();

  const startDate = useSelector((s) => s.tripRoom?.startDate);
  const endDate = useSelector((s) => s.tripRoom?.endDate);
  const roomId = useSelector((s) => s.tripRoom?.id ?? s.tripRoom?.roomId);
  const daysMap = useSelector((s) => s.itinerary?.days) || EMPTY_OBJ;

  // 🔸 보드 크기에 따른 카드 크기 계산
  const cardWidth = useMemo(() => {
    return Math.max(200, boardWidth - 40); // 패딩 고려한 카드 크기
  }, [boardWidth]);

  // 🔸 보드 컬럼 폭 계산
  const boardColWidth = useMemo(() => {
    return Math.max(240, boardWidth);
  }, [boardWidth]);

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

  /* ---------- 계산 상태/에러/타임아웃 ---------- */
  const {
    loadingByDate,
    errorByDate,
    markOwnRequestAndStart,
    markResolvedFromResult,
  } = useCalcStatusByDate(roomId, dates, { notify });

  /* ---------- travel/result 구독 + schedule 동기화 ---------- */
  useEffect(() => {
    if (!roomId) return;

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

        let t =
          (typeof transport === "string" && transport) ||
          getLastRequestedTransport(roomId, dayNum) ||
          "transit";
        t = String(t).toLowerCase();
        if (t === "driver") t = "driving";

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

        markResolvedFromResult(body);
      },
      { key: "travel-result/board" }
    );

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

    markOwnRequestAndStart(dateKey);

    publishTravel({
      roomId,
      day,
      date: dateKey,
      transpot: t,
      events,
    });
  };

  /* ---------- 날짜키 계산 ---------- */
  const getDateKeyForDayNumber = useCallback(
    (dayNumber) => {
      const d = Number(dayNumber);
      if (!Number.isFinite(d) || d < 1) return null;
      return dates[d - 1] || null;
    },
    [dates]
  );

  /* ---------- 일차 교체 적용: 기존 장소 제거 후 새 장소 채움 ---------- */
  const replaceDayWithPlaces = useCallback(
    (dateKey, legs) => {
      if (!dateKey || !Array.isArray(legs)) return;

      const current = board.byDate[dateKey] || EMPTY_ARR;

      for (let i = current.length - 1; i >= 0; i--) {
        const entryId = current[i]?.entryId;
        if (entryId != null) {
          dispatch(removeItem({ dateKey, entryId }));
        }
      }

      const ordered = [...legs].sort(
        (a, b) => (a?.eventOrder ?? 0) - (b?.eventOrder ?? 0)
      );

      ordered.forEach((leg, i) => {
        const placePayload = {
          wantId: leg.wantId,
          placeName: leg.placeName || "",
          imgUrl: leg.placeImg || undefined,
          category: leg.category || "",
          address: leg.address || "",
        };
        dispatch(
          addPlaceToDay({
            date: dateKey,
            place: placePayload,
            index: i,
          })
        );
      });

      const wantOrderIds = ordered
        .map((l) => Number(l.wantId))
        .filter((n) => Number.isFinite(n));
      if (wantOrderIds.length > 0) {
        dispatch(setOrderForDate({ dateKey, wantOrderIds }));
        publishSchedule({
          roomId,
          type: "REPLACE_DAY",
          dateKey,
          events: wantOrderIds.map((id, idx) => ({
            wantId: id,
            eventOrder: idx + 1,
          })),
        });
      }
    },
    [board.byDate, dispatch, roomId]
  );

  const activeItem = activeId ? board.idToMeta.get(activeId)?.item : null;

  // 🔸 모든 날짜를 표시하되, visibleBoards는 레이아웃 계산용으로만 사용
  const allDates = dates;

  /* ---------- render ---------- */
  return (
    <div
      ref={ref}
      id="itinerary-board-root"
      className="flex gap-4 overflow-x-auto p-2"
      style={{
        // 🔸 보드 컨테이너 최소 폭 설정 (모든 날짜 고려)
        minWidth: `${
          boardColWidth * dates.length + 16 * (dates.length - 1) + 32
        }px`,
      }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {allDates.map((dateKey, idx) => {
          const items = board.byDate[dateKey] || EMPTY_ARR;
          const t = transportByDate[dateKey] || "driving";
          const loading = !!loadingByDate[dateKey];
          const errMsg = errorByDate[dateKey];

          // 🔸 useMemo를 map 밖으로 이동하여 Hook 순서 문제 해결
          const placeList = items
            .map((it) => Number(it?.wantId ?? it?.placeId))
            .filter((n) => Number.isFinite(n));

          const applyRouteForThisDate = (legs, targetDayNumber) => {
            if (!Array.isArray(legs) || legs.length === 0) return;
            if (!roomId) return;

            let targetKey = dateKey;
            if (Number.isFinite(Number(targetDayNumber))) {
              const dk = getDateKeyForDayNumber(Number(targetDayNumber));
              if (dk) targetKey = dk;
            } else {
              const input = window.prompt(
                `적용할 일차를 입력하세요 (1 ~ ${dates.length})`,
                String(idx + 1)
              );
              const num = Number(input);
              const dk = Number.isFinite(num)
                ? getDateKeyForDayNumber(num)
                : null;
              if (!dk) {
                notify("error", "유효한 일차가 아닙니다.");
                return;
              }
              targetKey = dk;
            }

            replaceDayWithPlaces(targetKey, legs);
            const appliedIdx = dates.indexOf(targetKey);
            notify("success", `Day ${appliedIdx + 1} 일정으로 교체했습니다.`);
          };

          return (
            <section
              key={dateKey}
              className="flex-shrink-0 rounded-lg border border-slate-200 bg-white"
              style={{ width: boardColWidth }} // 🔸 동적 폭 적용
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

                  // 🔥 단일 장소 드래그도 웹소켓 공유
                  const wantId = Number(data.place.wantId);
                  if (Number.isFinite(wantId)) {
                    // 약간의 딜레이를 두고 현재 상태 기반으로 웹소켓 발행
                    setTimeout(() => {
                      const currentItems = board.byDate[dateKey] || [];
                      const events = currentItems
                        .map((it, i) => ({
                          wantId: Number(it.wantId ?? it.placeId),
                          eventOrder: i + 1,
                        }))
                        .filter((e) => Number.isFinite(e.wantId));

                      if (events.length > 0) {
                        publishSchedule({
                          roomId,
                          type: "ADD_PLACE",
                          dateKey,
                          events,
                        });
                      }
                    }, 50);
                  }
                  return;
                }

                if (
                  data?.type === "DAY_SCHEDULE" &&
                  Array.isArray(data?.places)
                ) {
                  const places = data.places
                    .filter((p) => p?.type === "PLACE" && p?.place)
                    .map((p) => p.place);

                  if (places.length > 0) {
                    const clientY = e.clientY ?? null;
                    let insertIndex = items.length;
                    if (clientY != null) {
                      insertIndex = computeInsertIndexInColumn(
                        dateKey,
                        clientY
                      );
                    }

                    places.forEach((place, index) => {
                      dispatch(
                        addPlaceToDay({
                          date: dateKey,
                          place: place,
                          index: insertIndex + index,
                        })
                      );
                    });

                    // 🔥 AI 하루 일정 드래그도 웹소켓 공유
                    const wantOrderIds = places
                      .map((p) => Number(p.wantId))
                      .filter((id) => Number.isFinite(id));

                    if (wantOrderIds.length > 0) {
                      // 약간의 딜레이를 두고 전체 상태 기반으로 웹소켓 발행
                      setTimeout(() => {
                        const currentItems = board.byDate[dateKey] || [];
                        const events = currentItems
                          .map((it, i) => ({
                            wantId: Number(it.wantId ?? it.placeId),
                            eventOrder: i + 1,
                          }))
                          .filter((e) => Number.isFinite(e.wantId));

                        if (events.length > 0) {
                          publishSchedule({
                            roomId,
                            type: "ADD_AI_SCHEDULE",
                            dateKey,
                            aiDay: data.day,
                            events,
                          });
                        }
                      }, 50);
                    }

                    notify(
                      "success",
                      `${data.day}일차 AI 추천 일정 ${places.length}곳을 ${dateKey}에 추가했습니다.`
                    );
                  }
                  return;
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
                    {/* 일차별 AI 경로 추천 모달 버튼 */}
                    <AiRouteDayModalButton
                      roomId={roomId}
                      day={idx + 1}
                      placeList={placeList}
                      onApply={(legs, targetDayNumber) =>
                        applyRouteForThisDate(legs, targetDayNumber)
                      }
                    />

                    <div className="h-5 w-px bg-slate-200 mx-1" />

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
                        {/* 드래그 정확도를 위한 카드 래퍼 데이터 속성 및 포인터 */}
                        <div
                          data-entry="card"
                          data-date={dateKey}
                          className="cursor-grab active:cursor-grabbing"
                          style={{ width: cardWidth }} // 🔸 동적 카드 폭 적용
                        >
                          <SortableItineraryCard
                            item={it}
                            dateKey={dateKey}
                            cardWidth={cardWidth} // 🔸 동적 카드 폭 전달
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
                        </div>

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
                            cardWidth={cardWidth} // 🔸 동적 카드 폭 전달
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
                        cardWidth={cardWidth} // 🔸 동적 카드 폭 전달
                      />
                    )}
                </div>
              </ColumnDroppable>
            </section>
          );
        })}

        <DragOverlay>
          {activeItem ? (
            <div className="relative" style={{ width: cardWidth }}>
              {" "}
              {/* 🔸 동적 폭 적용 */}
              <SharedPlaceCard
                place={activeItem}
                showVote={false}
                showAddress={false}
                isDraggable={false}
                enableTimePopover={false}
                cardWidth={cardWidth} // 🔸 동적 카드 폭 전달
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
});

export default ItineraryBoard;
