// src/features/itinerary/ui/DayDropZone.jsx
import React, { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import {
  addPlaceToDay,
  moveItemWithin,
  moveItemAcross,
} from "../../../redux/slices/itinerarySlice";
import ItineraryItemCard from "../ui/ItineraryItemCard";
import "./DayDropZone.css";

/**
 * DayDropZone
 * - 같은 Day 안 카드 재정렬
 * - 다른 Day로 카드 이동
 * - 외부(공유패널 등)에서 PLACE 드롭으로 추가
 *
 * 드래그 페이로드 규격
 * - ENTRY: { type: "ENTRY", entryId, fromDate, fromIdx }
 * - PLACE: { type: "PLACE", place }
 */
export default function DayDropZone({ date, items = [], className = "" }) {
  const dispatch = useDispatch();
  const zoneRef = useRef(null);
  const listRef = useRef(null);

  const [isOver, setIsOver] = useState(false);

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

  /** 커서 Y 위치로 삽입 인덱스 계산 (각 카드의 세로 중앙선 기준) */
  const calcInsertIndexByPointer = (clientY) => {
    const nodes = listRef.current?.querySelectorAll('[data-entry="card"]');
    if (!nodes || !nodes.length) return items.length;

    let insertIndex = 0;
    for (let i = 0; i < nodes.length; i++) {
      const rect = nodes[i].getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (clientY > mid) insertIndex = i + 1;
    }
    return insertIndex;
  };

  /** 섹션(배경) 드래그오버 */
  const onDragOver = (e) => {
    e.preventDefault();
    const data = parseDropData(e);
    // 같은 날짜에서의 ENTRY 이동은 move, 외부 PLACE 추가는 copy로 드랍 커서 표현
    try {
      e.dataTransfer.dropEffect =
        data?.type === "ENTRY" && data?.fromDate === date ? "move" : "copy";
    } catch {
      e.dataTransfer.dropEffect = "copy";
    }
    if (!isOver) setIsOver(true);
  };

  const onDragLeave = () => setIsOver(false);

  /** 섹션(배경) 드랍 */
  const onDrop = (e) => {
    e.preventDefault();
    setIsOver(false);
    const data = parseDropData(e);
    if (!data) return;

    const insertIndex = calcInsertIndexByPointer(e.clientY);

    // PLACE 추가
    if (data.type === "PLACE" && data.place) {
      dispatch(addPlaceToDay({ date, place: data.place, index: insertIndex }));
      return;
    }

    // ENTRY 이동
    if (
      data.type === "ENTRY" &&
      data.entryId &&
      data.fromDate != null &&
      Number.isInteger(data.fromIdx)
    ) {
      if (data.fromDate === date) {
        // 같은 날짜 내 재정렬 (보정)
        let toIdx = insertIndex;
        if (data.fromIdx < insertIndex) toIdx = insertIndex - 1;
        if (data.fromIdx !== toIdx) {
          dispatch(
            moveItemWithin({ dateKey: date, fromIdx: data.fromIdx, toIdx })
          );
        }
      } else {
        // 다른 날짜로 이동
        dispatch(
          moveItemAcross({
            fromDate: data.fromDate,
            toDate: date,
            fromIdx: data.fromIdx,
            toIdx: insertIndex,
          })
        );
      }
    }
  };

  return (
    <section
      ref={zoneRef}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`day-dropzone ${isOver ? "dragover" : ""} ${className}`}
      aria-label={`${date} 드롭존`}
    >
      {items?.length ? (
        <div ref={listRef} className="day-dropzone-list">
          {/* 맨 앞 드롭 슬롯 */}
          <DropSlot
            ariaLabel="맨 앞에 추가"
            onDropData={(data) => {
              if (data?.type === "PLACE" && data.place) {
                dispatch(addPlaceToDay({ date, place: data.place, index: 0 }));
              } else if (
                data?.type === "ENTRY" &&
                Number.isInteger(data.fromIdx) &&
                data.fromDate != null
              ) {
                if (data.fromDate === date) {
                  if (data.fromIdx !== 0) {
                    dispatch(
                      moveItemWithin({
                        dateKey: date,
                        fromIdx: data.fromIdx,
                        toIdx: 0,
                      })
                    );
                  }
                } else {
                  dispatch(
                    moveItemAcross({
                      fromDate: data.fromDate,
                      toDate: date,
                      fromIdx: data.fromIdx,
                      toIdx: 0,
                    })
                  );
                }
              }
            }}
          />

          {items.map((item, idx) => (
            <React.Fragment key={item.entryId || `${item.id}-${idx}`}>
              <div
                data-entry="card"
                className="dd-card-wrapper"
                draggable
                onDragStart={(e) => {
                  // ENTRY 페이로드 세팅
                  const body = JSON.stringify({
                    type: "ENTRY",
                    entryId: item.entryId,
                    fromDate: date,
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
                    dispatch(
                      addPlaceToDay({
                        date,
                        place: data.place,
                        index: insertIndex,
                      })
                    );
                    e.stopPropagation();
                    return;
                  }

                  // ENTRY 같은 날짜 재정렬
                  if (
                    data.type === "ENTRY" &&
                    data.fromDate === date &&
                    Number.isInteger(data.fromIdx)
                  ) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    let insertIndex =
                      e.clientY < rect.top + rect.height / 2 ? idx : idx + 1;
                    if (data.fromIdx < insertIndex) insertIndex -= 1; // 보정
                    if (data.fromIdx !== insertIndex) {
                      dispatch(
                        moveItemWithin({
                          dateKey: date,
                          fromIdx: data.fromIdx,
                          toIdx: insertIndex,
                        })
                      );
                    }
                    e.stopPropagation();
                    return;
                  }

                  // ENTRY 다른 날짜 → 교차 이동
                  if (
                    data.type === "ENTRY" &&
                    data.fromDate !== date &&
                    Number.isInteger(data.fromIdx)
                  ) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const insertIndex =
                      e.clientY < rect.top + rect.height / 2 ? idx : idx + 1;
                    dispatch(
                      moveItemAcross({
                        fromDate: data.fromDate,
                        toDate: date,
                        fromIdx: data.fromIdx,
                        toIdx: insertIndex,
                      })
                    );
                    e.stopPropagation();
                    return;
                  }
                }}
              >
                <ItineraryItemCard item={item} dateKey={date} index={idx} />
              </div>

              {/* 카드 뒤 드롭 슬롯 */}
              <DropSlot
                ariaLabel={`위치 ${idx + 1} 뒤에 추가`}
                onDropData={(data) => {
                  const index = idx + 1;
                  if (data?.type === "PLACE" && data.place) {
                    dispatch(addPlaceToDay({ date, place: data.place, index }));
                    return;
                  }
                  if (
                    data?.type === "ENTRY" &&
                    Number.isInteger(data.fromIdx) &&
                    data.fromDate != null
                  ) {
                    if (data.fromDate === date) {
                      let toIdx = index;
                      if (data.fromIdx < index) toIdx = index - 1; // 보정
                      if (data.fromIdx !== toIdx) {
                        dispatch(
                          moveItemWithin({
                            dateKey: date,
                            fromIdx: data.fromIdx,
                            toIdx,
                          })
                        );
                      }
                    } else {
                      dispatch(
                        moveItemAcross({
                          fromDate: data.fromDate,
                          toDate: date,
                          fromIdx: data.fromIdx,
                          toIdx: index,
                        })
                      );
                    }
                  }
                }}
              />
            </React.Fragment>
          ))}
        </div>
      ) : (
        <div className="day-dropzone-empty">장소를 드래그해서 담아주세요.</div>
      )}
    </section>
  );
}

/** 공용 드롭 슬롯(가이드 라인) */
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
      className="dd-slot"
      aria-label={ariaLabel}
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
    />
  );
}
