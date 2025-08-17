/**
 * itinerary 엔트리 배열을 서버 전송용 events 배열로 변환한다.
 * - 서버는 매 이벤트마다 "해당 날짜의 전체 events"를 받는다.
 * - eventOrder는 현재 배열 순서를 그대로 반영한다(0부터 시작).
 * - wantId는 서버가 식별하는 키로, 없으면 placeId/id를 보조로 사용한다.
 */
export function buildEventsFromDay(list = []) {
  return list.map((it, idx) => ({
    wantId: it.wantId ?? it.placeId ?? it.id ?? null,
    startTime: it.startTime ?? null,
    endTime: it.endTime ?? null,
    eventOrder: idx,
  }));
}
