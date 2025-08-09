// src/features/sharedPlace/ui/SharedPlacePanel.jsx
import { useDispatch } from "react-redux";
import AiButton from "@/features/tripPlanOptimize/ui/AiButton";
import SharedPlaceList from "./SharedPlaceList";
import { openRouteModal } from "../../../redux/slices/uiSlice";
import { useRemoveSharedPlace } from "../model/useRemoveSharedPlace";

export default function SharedPlacePanel({ roomId }) {
  const dispatch = useDispatch();
  const { removeSharedPlace } = useRemoveSharedPlace();

  const handleRemove = (place) => {
    if (!place?.wantId) return;
    removeSharedPlace(roomId, place.wantId);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <SharedPlaceList onRemove={handleRemove} />
      </div>

      <div className="border-t border-slate-200 p-4">
        <AiButton
          onPlanClick={() => console.log("AI 일정 추천")}
          onRouteClick={() => dispatch(openRouteModal())}
        />
      </div>
    </div>
  );
}
