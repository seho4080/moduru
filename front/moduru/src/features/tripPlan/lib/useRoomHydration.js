import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { hydrateItineraryFromServer } from "../lib/hydrateFromServer";

export default function useRoomHydration(roomId) {
  const dispatch = useDispatch();
  const daysMap = useSelector((s) => s.itinerary?.days || {});
  useEffect(() => {
    if (!roomId) return;
    hydrateItineraryFromServer(dispatch, roomId, () => daysMap);
  }, [dispatch, roomId]);
}
