// src/features/sharedPlace/ui/SharedPlaceList.jsx
import { useSelector } from "react-redux";
import { useMemo, useEffect, useRef } from "react";
import SharedPlaceCard from "./SharedPlaceCard";

const PANEL_WIDTH = 280;
const CARD_WIDTH = 240;
const ROW_SIDE_GAP = 24; // 체크박스 + 간격
const ROW_WIDTH = CARD_WIDTH + ROW_SIDE_GAP; // 264

export default function SharedPlaceList({
  selectMode = false,
  selectedWantIds = [],
  onChangeSelected,
  onRemove,
}) {
  const sharedPlaces = useSelector((s) => s.sharedPlace.sharedPlaces) || [];
  const daysMap = useSelector((s) => s.itinerary?.days ?? {});

  // ✅ 일정에 들어간 wantId/placeId 집합
  const usedSet = useMemo(() => {
    const set = new Set();
    Object.values(daysMap || {}).forEach((items) => {
      (items || []).forEach((it) => {
        const id = Number(it?.wantId ?? it?.placeId);
        if (Number.isFinite(id)) set.add(id);
      });
    });
    return set;
  }, [daysMap]);

  // 선택 Set (빠른 조회)
  const selectedSet = useMemo(
    () => new Set((selectedWantIds || []).map((v) => Number(v))),
    [selectedWantIds]
  );

  // 리스트에 표시 중인 wantId 목록(숫자형, 유효값만)
  const listIds = useMemo(() => {
    const arr = [];
    for (const p of sharedPlaces) {
      const id = Number(p?.wantId ?? p?.id ?? p?.placeId);
      if (Number.isFinite(id)) arr.push(id);
    }
    return arr;
  }, [sharedPlaces]);

  // 모두선택 체크 상태 계산
  const selectedCountInList = useMemo(
    () => listIds.filter((id) => selectedSet.has(id)).length,
    [listIds, selectedSet]
  );
  const allSelected =
    listIds.length > 0 && selectedCountInList === listIds.length;
  const someSelected =
    listIds.length > 0 &&
    selectedCountInList > 0 &&
    selectedCountInList < listIds.length;

  // 모두선택 토글
  const onToggleAll = () => {
    if (!onChangeSelected) return;
    const next = new Set(selectedSet);
    if (allSelected) {
      // 리스트에 있는 것들만 해제
      listIds.forEach((id) => next.delete(id));
    } else {
      // 리스트에 있는 것들 모두 추가
      listIds.forEach((id) => next.add(id));
    }
    onChangeSelected(Array.from(next));
  };

  // indeterminate 표시
  const selectAllRef = useRef(null);
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  // 단일 토글
  const toggle = (wantId) => {
    if (!onChangeSelected) return;
    const id = Number(wantId);
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChangeSelected(Array.from(next));
  };

  if (!sharedPlaces.length) {
    return (
      <div className="text-sm text-slate-500">공유된 장소가 없습니다.</div>
    );
  }

  // 모드에 따른 행 너비
  const rowWidth = selectMode ? ROW_WIDTH : CARD_WIDTH;

  return (
    <div className="w-full" style={{ maxWidth: PANEL_WIDTH }}>
      {/* ✅ 모두 선택 바 (선택 모드에서만 노출) */}
      {selectMode && (
        <div
          className="w-full mt-2 flex justify-center"
          style={{ paddingLeft: 4, paddingRight: 4 }}
        >
          <div
            className="flex items-center justify-between text-[12px] text-slate-700"
            style={{ width: rowWidth }}
          >
            <label className="inline-flex items-center gap-2 select-none">
              <input
                ref={selectAllRef}
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                title="모두 선택"
                data-nodrag
              />
              <span>모두 선택</span>
            </label>
            <span className="text-slate-500">
              {selectedCountInList}/{listIds.length}
            </span>
          </div>
        </div>
      )}

      <div className="w-full mt-2 flex flex-col items-center gap-3">
        {sharedPlaces.map((place) => {
          const key =
            place.wantId ?? `${place.placeId}-${place.lat}-${place.lng}`;
          const wantId = place.wantId ?? place.id ?? place.placeId;
          const checked = selectedSet.has(Number(wantId));
          const isUsed = usedSet.has(Number(wantId));

          return (
            <div
              key={key}
              className="w-full flex justify-center"
              style={{ paddingLeft: 4, paddingRight: 4 }}
            >
              <div
                className={`flex items-start ${selectMode ? "gap-2" : "gap-0"}`}
                style={{ width: rowWidth }}
              >
                {/* ✅ 선택 모드일 때만 체크박스 렌더 */}
                {selectMode && (
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(wantId)}
                    title="AI 추천에 포함"
                    style={{ marginTop: 6 }}
                    data-nodrag
                  />
                )}

                <div>
                  <SharedPlaceCard
                    place={place}
                    onRemove={() => onRemove?.(place)}
                    cardWidth={CARD_WIDTH} // 240px 고정
                    usedInItinerary={isUsed} // ✅ 일정 포함 UX 표시
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
