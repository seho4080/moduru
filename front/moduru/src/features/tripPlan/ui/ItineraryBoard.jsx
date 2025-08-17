// src/features/tripPlan/ui/ItineraryBoard.jsx
import React, {
  useMemo,
  useState,
  useEffect,
  forwardRef,
  useCallback,
  useRef,
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
import { selectSelectedPinId, selectSelectedDay, setSelectedDay } from "../../../redux/slices/mapSlice";

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
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

import SharedPlaceCard from "../../sharedPlace/ui/SharedPlaceCard";
import {
  publishTravel,
  getLastRequestedTransport,
} from "../../webSocket/travelSocket";
import { publishSchedule } from "../../webSocket/scheduleSocket";
import { upsertDayEtas, upsertDayTotals } from "../../../redux/slices/etaSlice";
import useCalcStatusByDate from "./useCalcStatusByDate";

import ColumnDroppable from "./components/ColumnDroppable";
import SortableItineraryCard from "./components/SortableItineraryCard";
import SortableColumn from "./components/SortableColumn";
import LegETA from "./components/LegETA";
import DayTotals from "./components/DayTotals";
import TransportRadio from "./components/TransportRadio";
import { computeInsertIndexInColumn, getActiveCenterY } from "./dndUtils";

import AiRouteDayModalButton from "../../aiRoute/ui/AiRouteDayModalButton";

const SCHEDULE_HANDLER = "schedule";
const EMPTY_OBJ = Object.freeze({});
const EMPTY_ARR = Object.freeze([]);

function notify(type, message) {
  if (window?.toast?.[type]) window.toast[type](message);
  else if (window?.toast) window.toast(message);
  else if (type === "error") alert(message);
  else console.log(`[${type}] ${message}`);
}

const ItineraryBoard = forwardRef(function ItineraryBoard(
  {
    transport = "driving",
    showEta = true,
    boardWidth = 280,
    visibleBoards = 3,
    panelType = "side",
    onCardClick,
  },
  ref
) {
  console.log('ItineraryBoard onCardClick:', onCardClick);
  const dispatch = useDispatch();

  const startDate = useSelector((s) => s.tripRoom?.startDate);
  const endDate = useSelector((s) => s.tripRoom?.endDate);
  const roomId = useSelector((s) => s.tripRoom?.id ?? s.tripRoom?.roomId);
  const daysMap = useSelector((s) => s.itinerary?.days) || EMPTY_OBJ;
  const selectedPinId = useSelector(selectSelectedPinId);
  const selectedDay = useSelector(selectSelectedDay);

  // 최신 daysMap을 참조하기 위한 ref (setTimeout 등 비동기 콜백에서 사용)
  const daysRef = useRef(daysMap);
  useEffect(() => {
    daysRef.current = daysMap;
  }, [daysMap]);

  const cardWidth = useMemo(() => Math.max(180, boardWidth - 60), [boardWidth]);

  // 컬럼 너비는 고정, 높이는 카드 개수에 따라 조정
  const columnWidth = useMemo(() => Math.max(240, boardWidth), [boardWidth]);

  // 날짜 배열
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

  // dateKey -> 1-based day
  const dayOf = useCallback(
    (dateKey) => {
      const i = dates.indexOf(dateKey);
      return i >= 0 ? i + 1 : null;  // 이미 1-based로 되어 있음
    },
    [dates]
  );

  // dnd-kit
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

  // 컬럼 단위 드래그를 위한 컬럼 ID 배열
  const columnIds = useMemo(() => dates.map(dateKey => `col:${dateKey}`), [dates]);

  // 저장 버튼 활성화를 위한 dirty 신호
  const fireDirty = useCallback(() => {
    if (!roomId) return;
    window.dispatchEvent(
      new CustomEvent("schedule:dirty", { detail: { roomId } })
    );
  }, [roomId]);

  // 날짜별 현재 스냅샷을 서버로 발행
  const publishSnapshotForDate = useCallback(
    (dateKey, type, extra = {}) => {
      if (!roomId || !dateKey) return;
      const day = dayOf(dateKey);
      if (!day) return;
      const currentItems = (daysRef.current?.[dateKey] || []).filter(Boolean);
      const events = currentItems
        .map((it, i) => ({
          wantId: Number(it.wantId ?? it.placeId),
          eventOrder: i + 1,
        }))
        .filter((e) => Number.isFinite(e.wantId));
      publishSchedule({ roomId, type, date: dateKey, day, events, ...extra });
    },
    [roomId, dayOf]
  );

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

    // 컬럼 드래그인지 확인
    if (activeIdStr.startsWith('col:')) {
      const fromDate = activeIdStr.slice(4);
      const toDate = overIdStr.startsWith('col:') ? overIdStr.slice(4) : null;

      if (toDate && fromDate !== toDate) {
        // 컬럼 순서 변경 (날짜 순서 변경)
        const fromIndex = dates.indexOf(fromDate);
        const toIndex = dates.indexOf(toDate);

        if (fromIndex !== -1 && toIndex !== -1) {
          // 날짜 배열에서 순서 변경
          const newDates = [...dates];
          const [movedDate] = newDates.splice(fromIndex, 1);
          newDates.splice(toIndex, 0, movedDate);

          // 여기서는 단순히 알림만 표시 (실제 날짜 순서 변경은 복잡하므로)
          notify("info", "컬럼 순서 변경은 현재 지원되지 않습니다.");
        }
      }
      return;
    }

    // 카드 드래그 (기존 로직 유지)
    if (!board.idToMeta.has(activeIdStr)) return;

    const from = board.idToMeta.get(activeIdStr);
    const to = getTargetPosition(overIdStr);
    if (!to) return;

    const fromDate = from.dateKey;
    const toDate = to.dateKey;

    // 같은 컬럼 빈 공간에 드롭
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
        setTimeout(() => {
          publishSnapshotForDate(fromDate, "UPDATE_ORDER");
          fireDirty();
        }, 0);
      }
      return;
    }

    // 같은 컬럼 카드 위에 드롭
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
        setTimeout(() => {
          publishSnapshotForDate(fromDate, "UPDATE_ORDER");
          fireDirty();
        }, 0);
      }
      return;
    }

    // 다른 날짜로 이동
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
    setTimeout(() => {
      publishSnapshotForDate(fromDate, "UPDATE_ORDER");
      publishSnapshotForDate(toDate, "UPDATE_ORDER");
      fireDirty();
    }, 0);
  };

  // 일자별 교통수단
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

  // ETA 계산 상태 관리
  const {
    loadingByDate,
    errorByDate,
    markOwnRequestAndStart,
    markResolvedFromResult,
  } = useCalcStatusByDate(roomId, dates, { notify });

  // WebSocket 구독은 TripRoomProvider에서 통합 처리
  // 개별 구독은 제거하여 중복 방지

  // 네이티브 드롭 파싱
  function parseDropData(e) {
    let json = null;
    try {
      json = e.dataTransfer?.getData("application/json");
      if (!json) json = e.dataTransfer?.getData("text/plain");
    } catch { }
    if (!json) return null;
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  // 일자별 소요시간 계산 요청
  const requestCalcForDate = (dateKey) => {
    if (!roomId) return;
    const items = board.byDate[dateKey] || EMPTY_ARR;
    if (items.length < 2) {
      notify("info", "이동 경로가 2개 이상일 때만 계산됩니다.");
      return;
    }
    const t = transportByDate[dateKey] || "driving";

    const day = dates.indexOf(dateKey) + 1;
    
    // 디버깅 로그 추가
    console.log("🔍 [requestCalcForDate] dateKey=", dateKey, "dates=", dates, "day=", day);

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
      transport: t, // 오타 수정: transpot -> transport
      events,
    });
  };

  // day number -> dateKey
  const getDateKeyForDayNumber = useCallback(
    (dayNumber) => {
      const d = Number(dayNumber);
      if (!Number.isFinite(d) || d < 1) return null;
      return dates[d - 1] || null;
    },
    [dates]
  );

  // 일차 교체: 기존 제거 후 새로 채우고 순서 반영
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
        
        // AI 일정 적용 시 draftVersion을 명시적으로 업데이트
        const day = dayOf(dateKey);
        if (day) {
          dispatch(setDraftVersion({ day, draftVersion: 1 }));
        }
        
        // 디버깅 로그 추가
        console.log("🔍 [replaceDayWithPlaces] dateKey=", dateKey, "day=", day);
        
        publishSchedule({
          roomId,
          type: "REPLACE_DAY",
          date: dateKey,  // dateKey를 date로 변경
          day: day,
          events: wantOrderIds.map((id, idx) => ({
            wantId: id,
            eventOrder: idx + 1,
          })),
        });
      }
      fireDirty();
    },
    [board.byDate, dispatch, roomId, dayOf, fireDirty]
  );

  const activeItem = activeId ? board.idToMeta.get(activeId)?.item : null;

  const allDates = dates;

  return (
    <div
      ref={ref}
      id="itinerary-board-root"
      className="flex gap-4 overflow-x-auto p-2"
      style={{
        minWidth: `${columnWidth * dates.length + 16 * (dates.length - 1) + 32
          }px`,
      }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
          {dates.map((dateKey, idx) => {
            const items = board.byDate[dateKey] || EMPTY_ARR;
            const t = transportByDate[dateKey] || "driving";
            const loading = !!loadingByDate[dateKey];
            const errMsg = errorByDate[dateKey];

            const placeList = items
              .map((it) => Number(it?.wantId ?? it?.placeId))
              .filter((n) => Number.isFinite(n));

            const applyRouteForThisDate = (legs) => {
              if (!Array.isArray(legs) || legs.length === 0) return;
              if (!roomId) return;

              // 해당 날짜에 바로 적용
              replaceDayWithPlaces(dateKey, legs);
              notify("success", `Day ${idx + 1} 일정으로 교체했습니다.`);
            };

            return (
              <SortableColumn
                key={dateKey}
                id={`col:${dateKey}`}
                width={columnWidth}
                itemCount={items.length}
                onCardClick={onCardClick}
                selectedPinId={selectedPinId}
                isSelected={selectedDay === dateKey}
                onDaySelect={() => dispatch(setSelectedDay(dateKey))}
                aria-label={`Day ${idx + 1} ${dateKey}`}

              >
                {/* 헤더 */}
                <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-3 py-1.5">
                  <div className="flex flex-col gap-1">
                    {/* Day와 날짜 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-slate-800">Day {idx + 1}</div>
                        <div className="text-xs text-slate-500">{dateKey}</div>
                      </div>
                    </div>

                    {/* 버튼들 */}
                    <div
                      className="flex items-center justify-between gap-2"
                      data-html2canvas-ignore="true"
                    >
                      <AiRouteDayModalButton
                        roomId={roomId}
                        day={idx + 1}
                        placeList={placeList}
                        onApply={(legs) => applyRouteForThisDate(legs)}
                      />

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
                          onTransportChange={(val) => {
                            // 교통수단 변경 시 로그 출력
                            console.log(`Transport changed to ${val} for ${dateKey}`);
                          }}
                        />
                        <button
                          type="button"
                          className={`text-xs rounded border px-2 py-1 ${loading
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
                  </div>

                  {errMsg ? (
                    <div className="mt-1 text-[11px] text-red-600">{errMsg}</div>
                  ) : null}
                </header>

                <ColumnDroppable
                  dateKey={dateKey}
                  width={columnWidth}
                  itemCount={items.length}
                  onDragOver={(e) => {
                    e.preventDefault();
                    try {
                      const json = e.dataTransfer?.getData("application/json");
                      if (json) e.dataTransfer.dropEffect = "copy";
                    } catch { }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const data = parseDropData(e);

                    // 단일 장소 드롭
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

                      const wantId = Number(data.place.wantId);
                      if (Number.isFinite(wantId)) {
                        setTimeout(() => {
                          publishSnapshotForDate(dateKey, "ADD_PLACE");
                          fireDirty();
                        }, 0);
                      }
                      return;
                    }

                    // AI 하루 일정 드롭
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

                        setTimeout(() => {
                          publishSnapshotForDate(dateKey, "ADD_AI_SCHEDULE", {
                            aiDay: data.day,
                          });
                          fireDirty();
                        }, 0);

                        notify(
                          "success",
                          `${data.day}일차 추천 일정 ${places.length}곳을 ${dateKey}에 추가했습니다.`
                        );
                      }
                      return;
                    }
                  }}
                >
                  <div
                    className="p-2 flex flex-col items-center gap-2 min-h-[80px]"
                    data-col={dateKey}
                    style={{ width: columnWidth }}
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
                            cardWidth={cardWidth}
                            onCardClick={onCardClick}
                            isSelected={selectedPinId === (it.wantId || it.id)}
                            onRemove={() => {
                              dispatch(
                                removeItem({ dateKey, entryId: it.entryId })
                              );
                              setTimeout(() => {
                                const itemsNow =
                                  daysRef.current?.[dateKey] || [];
                                const isEmpty = itemsNow.length === 0;
                                publishSnapshotForDate(
                                  dateKey,
                                  isEmpty ? "CLEAR_DAY" : "UPDATE_ORDER"
                                );
                                fireDirty();
                              }, 0);
                            }}
                            onConfirmTimes={(s, e) => {
                              dispatch(
                                setTimes({
                                  dateKey,
                                  entryId: it.entryId,
                                  startTime: s,
                                  endTime: e,
                                })
                              );
                              fireDirty();
                            }}
                          />

                          {showEta && items[itemIdx + 1] && (
                            <LegETA
                              day={idx + 1}
                              requestedTransport={t}
                              fromId={it.wantId ?? it.placeId}
                              toId={
                                items[itemIdx + 1].wantId ??
                                items[itemIdx + 1].placeId
                              }
                              cardWidth={cardWidth}
                            />
                          )}
                        </React.Fragment>
                      ))}
                    </SortableContext>

                    {showEta &&
                      items.filter((x) =>
                        Number.isFinite(Number(x.wantId ?? x.placeId ?? x.id))
                      ).length >= 2 && (
                        <DayTotals
                          day={idx + 1}
                          requestedTransport={t}
                          cardWidth={cardWidth}
                        />
                      )}
                  </div>
                </ColumnDroppable>
              </SortableColumn>
            );
          })}
        </SortableContext>

        <DragOverlay>
          {activeId && activeId.startsWith('col:') ? (
            <div className="relative" style={{ width: columnWidth }}>
              <div className="flex-shrink-0 rounded-lg border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-800">
                  컬럼 드래그 중...
                </div>
              </div>
            </div>
          ) : activeItem ? (
            <div className="relative" style={{ width: cardWidth }}>
              <SharedPlaceCard
                place={activeItem}
                showVote={false}
                showAddress={false}
                isDraggable={false}
                enableTimePopover={false}
                cardWidth={cardWidth}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
});

export default ItineraryBoard;
