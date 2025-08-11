import React from "react";
import { FaBus, FaArrowDown } from "react-icons/fa";
import SharedPlaceCard from "../../sharedPlace/ui/SharedPlaceCard";

export default function ScheduleDay({ items = [], onRemovePlace }) {
  return (
    <div className="w-[200px]">
      {/* 상단 라벨 */}
      <div className="mb-1 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700">
        <FaBus />
        <span>소요 시간 계산</span>
      </div>

      {/* 리스트: 세로 스크롤, ~7개 보임 */}
      <div className="flex max-h-[22rem] flex-col gap-1.5 overflow-auto pr-1">
        {items.map((raw, idx) => {
          const place = raw.place ?? raw; // place만 넘어와도 OK
          const durationMin = raw.durationMin ?? 0;

          return (
            <div
              key={place.id ?? `${place.placeName}-${idx}`}
              className="flex flex-col items-center"
            >
              <SharedPlaceCard
                place={place}
                onRemove={onRemovePlace}
                className="w-full"
                compact
              />

              {/* 다음 장소로 가는 이동 구간 (마지막 제외) */}
              {idx < items.length - 1 && (
                <div className="my-1 flex flex-col items-center">
                  <FaArrowDown className="text-base text-blue-600" />
                  <div className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] text-gray-600">
                    <FaBus />
                    <span>{durationMin}분</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
