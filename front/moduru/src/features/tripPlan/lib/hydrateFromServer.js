// src/features/tripPlan/lib/hydrateFromServer.js
import api from "@/lib/axios";
import { addPlaceToDay, setTimes } from "@/redux/slices/itinerarySlice";

/**
 * 서버 저장된 스케줄/희망장소로 보드를 복원한다.
 * - schedules: [{ day(0-based), date, events:[{ wantId, placeName, placeImg, startTime, endTime, eventOrder, lat, lng }] }]
 * - wants:     { placesWant: [{ wantId, placeName, placeImg, category, address, lat, lng, ... }] }
 * @returns {Promise<boolean>} 실제로 복원했는지 여부
 */
export async function hydrateItineraryFromServer(dispatch, roomId, getDaysMap) {
  if (!roomId) return false;

  const daysMap = typeof getDaysMap === "function" ? getDaysMap() : {};
  // 이미 카드가 꽤 있으면 중복 복원 방지 (빈 상태일 때만 복원)
  const anyCard =
    Object.values(daysMap || {}).some((arr) => (arr?.length || 0) > 0) || false;
  if (anyCard) return false;

  try {
    const [{ data: schedules }, { data: wantsResp }] = await Promise.all([
      api.get(`/rooms/${roomId}/schedules`),
      api.get(`/rooms/${roomId}/wants`),
    ]);

    if (!Array.isArray(schedules) || schedules.length === 0) return false;

    const wantMap = new Map();
    (wantsResp?.placesWant || []).forEach((w) =>
      wantMap.set(Number(w.wantId), w)
    );

    let restored = 0;

    for (const dayBlock of schedules) {
      const dateKey = dayBlock?.date;
      if (!dateKey) continue;

      const events = Array.isArray(dayBlock?.events) ? dayBlock.events : [];
      // eventOrder 기준 정렬
      const ordered = [...events].sort(
        (a, b) => (a.eventOrder ?? 0) - (b.eventOrder ?? 0)
      );

      ordered.forEach((ev, idx) => {
        const wid = Number(ev?.wantId);
        if (!Number.isFinite(wid)) return;
        const w = wantMap.get(wid);

        const place = {
          wantId: wid,
          placeId: wid, // 내부 카드 구조 통일
          placeName: ev.placeName ?? w?.placeName ?? "",
          imgUrl: ev.placeImg ?? w?.placeImg ?? null,
          category: w?.category ?? null,
          address: w?.address ?? null,
          lat: ev.lat ?? w?.lat ?? null,
          lng: ev.lng ?? w?.lng ?? null,
        };

        // 날짜별 idx 순서대로 삽입
        dispatch(
          addPlaceToDay({
            date: dateKey,
            place,
            index: idx,
          })
        );

        if (ev.startTime || ev.endTime) {
          dispatch(
            setTimes({
              dateKey,
              wantId: wid,
              startTime: ev.startTime ?? "",
              endTime: ev.endTime ?? "",
            })
          );
        }
        restored++;
      });
    }

    return restored > 0;
  } catch (e) {
    console.error("[hydrateFromServer] 복원 실패:", e);
    return false;
  }
}
