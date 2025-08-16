// src/features/tripPlan/lib/useRoomHydration.js
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getSchedules } from "./scheduleApi";
import { replaceDayFromServer } from "../../../redux/slices/itinerarySlice";

/** 보드가 비어 있을 때만 서버 저장본으로 복원 */
export default function useRoomHydration(roomId) {
  const dispatch = useDispatch();

  const daysMap = useSelector((s) => s.itinerary?.days || {});
  const isEmpty =
    !daysMap || Object.values(daysMap).every((arr) => !arr?.length);

  useEffect(() => {
    let aborted = false;
    if (!roomId || !isEmpty) return;

    (async () => {
      const { status, data } = await getSchedules(roomId);
      if (aborted) return;

      if (status !== 200 || !Array.isArray(data)) {
        console.warn("[hydrate] schedules fetch failed:", status, data);
        return;
      }

      // 날짜 오름차순 정렬(서버가 정렬해서 주지 않더라도 안전)
      const list = [...data].sort((a, b) =>
        String(a?.date || "").localeCompare(String(b?.date || ""))
      );

      list.forEach((row) => {
        const dateKey = row?.date;
        const events = Array.isArray(row?.events) ? row.events : [];
        if (!dateKey) return;

        // eventOrder 오름차순 정렬
        const sorted = [...events].sort(
          (a, b) => Number(a?.eventOrder ?? 0) - Number(b?.eventOrder ?? 0)
        );

        // 보드/카드에서 쓰는 구조로 매핑
        const normalized = sorted.map((ev, idx) => {
          const wantId = Number(ev?.wantId ?? ev?.placeId ?? ev?.id);
          const startTime = ev?.startTime || "";
          const endTime = ev?.endTime || "";
          const eventOrder = Number(ev?.eventOrder ?? idx + 1);

          // DnD용 entryId가 없을 수 있으므로 안전하게 생성
          const entryId =
            ev?.entryId ??
            `${dateKey}|${eventOrder}|${wantId || "x"}|${startTime}-${endTime}`;

          return {
            // 공통 식별
            entryId,
            wantId,
            placeId: ev?.placeId ?? wantId,

            // 카드 표시용
            placeName: ev?.placeName ?? "이름 없음",
            imgUrl: ev?.placeImg ?? ev?.imgUrl ?? null,
            category: ev?.category ?? null,
            address: ev?.address ?? null,

            // 시간/좌표/정렬
            startTime,
            endTime,
            eventOrder,
            lat: typeof ev?.lat === "number" ? ev.lat : null,
            lng: typeof ev?.lng === "number" ? ev.lng : null,

            // 서버가 내려줄 수도 있는 필드들 보존
            nextTravelTime: ev?.nextTravelTime ?? null,
          };
        });

        // 날짜별로 갈아끼우기
        dispatch(
          replaceDayFromServer({
            dateKey,
            events: normalized,
          })
        );
      });
    })();

    return () => {
      aborted = true;
    };
  }, [roomId, isEmpty, dispatch]);
}
