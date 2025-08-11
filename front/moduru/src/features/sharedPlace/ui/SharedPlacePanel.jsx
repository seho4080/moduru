// src/features/sharedPlace/ui/SharedPlacePanel.jsx
import { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import SharedPlaceList from "./SharedPlaceList";
import { useRemoveSharedPlace } from "../model/useRemoveSharedPlace";
import {
  openItineraryModal,
  closeItineraryModal,
} from "../../../redux/slices/uiSlice";
import ItineraryModal from "@/features/tripPlan/ui/ItineraryModal"; // 경로 맞게

const TABS = ["전체", "음식점", "명소", "축제"];

export default function SharedPlacePanel({ roomId }) {
  const dispatch = useDispatch();
  const { removeSharedPlace } = useRemoveSharedPlace();
  const [activeTab, setActiveTab] = useState("전체");

  const isItineraryOpen = useSelector((s) => s.ui.isItineraryModalOpen);

  const filterCategory = useMemo(
    () => (activeTab === "전체" ? "" : activeTab),
    [activeTab]
  );

  const handleRemove = (place) => {
    if (!place?.wantId) return;
    removeSharedPlace(roomId, place.wantId);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="bg-white">
        <div className="relative flex items-center gap-2 px-5 pt-4 pb-2 border-b border-slate-200">
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  isActive
                    ? "bg-[#FFE135] text-black font-medium"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-0 pt-2">
        <SharedPlaceList
          onRemove={handleRemove}
          filterCategory={filterCategory}
        />
      </div>

      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => dispatch(openItineraryModal())}
            className="flex-1 rounded-lg bg-[#4169e1] px-4 py-2 text-sm font-semibold text-white hover:brightness-95 active:brightness-90"
          >
            일정표 담기
          </button>
        </div>
      </div>

      {/* 여기서 상태 기반으로 모달 표시 */}
      {isItineraryOpen && (
        <ItineraryModal onClose={() => dispatch(closeItineraryModal())} />
      )}
    </div>
  );
}
