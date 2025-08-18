// src/features/itinerary/lib/itineraryLocalDraft.js
const DRAFT_KEY = (roomId) => `itinDraft:${roomId}`;

/** daysMap -> 압축 저장 */
export function saveItinDraft(roomId, { daysMap }) {
  if (!roomId || !daysMap) return;
  const days = {};
  for (const [dateKey, arr] of Object.entries(daysMap || {})) {
    days[dateKey] = (arr || []).map((it) => ({
      // 식별/표시 필드
      wantId: it.wantId ?? it.id ?? it.placeId ?? null,
      placeId: it.placeId ?? null,
      placeName: it.placeName ?? it.name ?? "",
      imgUrl: it.imgUrl ?? null,
      category: it.category ?? null,
      address: it.address ?? null,
      lat: it.lat ?? null,
      lng: it.lng ?? null,
      // 시간/정렬
      startTime: it.startTime ?? "",
      endTime: it.endTime ?? "",
      eventOrder:
        it.eventOrder ?? it.order ?? it.seq ?? it.index ?? it.position ?? null,
    }));
  }
  const payload = { days, savedAt: Date.now() };
  try {
    localStorage.setItem(DRAFT_KEY(roomId), JSON.stringify(payload));
    // 디버깅 로그(원하면 주석 처리)
    // console.log("[itinDraft] save", roomId, payload);
  } catch {}
}

export function loadItinDraft(roomId) {
  if (!roomId) return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY(roomId));
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object") return null;
    return obj; // { days: {dateKey: [...]}, savedAt }
  } catch {
    return null;
  }
}
