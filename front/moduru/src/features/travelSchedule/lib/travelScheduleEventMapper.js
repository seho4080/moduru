/**
 * 날짜의 엔트리 배열 → 서버 events
 * - eventOrder는 배열 인덱스 기반(0부터 시작)
 * - wantId가 우선, 없으면 placeId/id 사용
 * - time 필드는 문자열 또는 null
 */
export function buildEventsFromDay(list = []) {
  return list.map((it, idx) => ({
    wantId: it.wantId ?? it.placeId ?? it.id ?? null,
    startTime: it.startTime ?? null,
    endTime: it.endTime ?? null,
    eventOrder: idx,
  }));
}
