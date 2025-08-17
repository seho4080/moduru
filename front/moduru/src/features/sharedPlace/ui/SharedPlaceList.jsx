import { useSelector, useDispatch } from "react-redux"; // ✅ useDispatch 추가
import { useMemo, useEffect, useRef } from "react";
import SharedPlaceCard from "./SharedPlaceCard";
import { postPlaceVote } from "@/features/placeVote/lib/placeVoteApi";
import { updateVoteState } from "@/redux/slices/sharedPlaceSlice";
import { useParams } from "react-router-dom";

export default function SharedPlaceList({
  selectMode = false,
  selectedWantIds = [],
  onChangeSelected,
  onRemove,
  onCardClick,
}) {
  const dispatch = useDispatch(); // ✅ 정상 동작
  const params = useParams();

  const { roomId: roomIdParam } = params;
  const roomId = useMemo(() => {
    const v = Number(roomIdParam);
    return Number.isFinite(v) ? v : undefined;
  }, [roomIdParam]);

  const sharedPlaces = useSelector((s) => s.sharedPlace.sharedPlaces) || [];
  const daysMap = useSelector((s) => s.itinerary?.days ?? {});

  const tripRoom = useSelector((s) => s.tripRoom);
  const fallbackRoomId = tripRoom?.roomId;

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

  const selectedSet = useMemo(
    () => new Set((selectedWantIds || []).map((v) => Number(v))),
    [selectedWantIds]
  );

  const listIds = useMemo(() => {
    const arr = [];
    for (const p of sharedPlaces) {
      const id = Number(p?.wantId ?? p?.id ?? p?.placeId);
      if (Number.isFinite(id)) arr.push(id);
    }
    return arr;
  }, [sharedPlaces]);

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

  const onToggleAll = () => {
    if (!onChangeSelected) return;
    const next = new Set(selectedSet);
    if (allSelected) {
      listIds.forEach((id) => next.delete(id));
    } else {
      listIds.forEach((id) => next.add(id));
    }
    onChangeSelected(Array.from(next));
  };

  const selectAllRef = useRef(null);
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const toggle = (wantId) => {
    if (!onChangeSelected) return;
    const id = Number(wantId);
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChangeSelected(Array.from(next));
  };

  // ✅ 하트 클릭 -> 투표 API 호출 및 Redux 갱신
  const handleHeart = async (place) => {
    const wantId = Number(place?.wantId ?? place?.id ?? place?.placeId);
    const finalRoomId = roomId || fallbackRoomId;
    if (!finalRoomId || !Number.isFinite(wantId)) {
      console.warn("[하트클릭] 잘못된 roomId 또는 wantId:", { finalRoomId, wantId });
      return;
    }
    try {
      const response = await postPlaceVote(finalRoomId, wantId);
      if (response?.data) {
        const { wantId: responseWantId, isVoted, voted } = response.data;
        const finalIsVoted = isVoted !== undefined ? isVoted : voted;
        if (typeof finalIsVoted === "boolean") {
          dispatch(updateVoteState({ wantId: responseWantId ?? wantId, isVoted: finalIsVoted }));
        }
      }
    } catch (err) {
      console.error("[하트클릭] 투표 실패:", err?.response?.status, err?.response?.data || err?.message);
    }
  };

  if (!sharedPlaces.length) {
    return (
      <div className="text-sm text-slate-500 p-4 text-center">
        공유된 장소가 없습니다.
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {selectMode && (
        <div className="flex-shrink-0 px-4 py-2 border-b border-slate-200">
          <div className="flex items-center justify-between text-sm text-slate-700">
            <label className="inline-flex items-center gap-2 select-none cursor-pointer">
              <input
                ref={selectAllRef}
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                title="모두 선택"
                data-nodrag
                className="rounded"
              />
              <span>모두 선택</span>
            </label>
            <span className="text-slate-500 text-xs">
              {selectedCountInList}/{listIds.length}
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {sharedPlaces.map((place) => {
            const key = place.wantId ?? `${place.placeId}-${place.lat}-${place.lng}`;
            const wantId = place.wantId ?? place.id ?? place.placeId;
            const checked = selectedSet.has(Number(wantId));
            const isUsed = usedSet.has(Number(wantId));

            return (
              <div
                key={key}
                className={`flex items-start gap-3 ${selectMode ? "pl-0" : ""}`}
              >
                {selectMode && (
                  <div className="flex-shrink-0 pt-1">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(wantId)}
                      title="AI 추천에 포함"
                      data-nodrag
                      className="rounded"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <SharedPlaceCard
                    place={place}
                    onRemove={() => onRemove?.(place)}
                    onCardClick={onCardClick}
                    onHeartClick={handleHeart}          {/* ✅ 추가: 투표 핸들러 전달 */}
                    usedInItinerary={isUsed}
                    isSelected={checked}                 {/* 선택 강조 쓰려면 */}
                    // responsive={true}                 {/* 카드에서 안 쓰면 제거해도 됨 */}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
