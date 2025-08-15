// src/features/sharedPlace/ui/SharedPlaceList.jsx
import { useSelector } from "react-redux";
import { useMemo } from "react";
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

  // 토글 헬퍼
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
