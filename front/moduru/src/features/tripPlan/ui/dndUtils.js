/** 드래그 중인 카드의 세로 중앙 Y 좌표 */
export function getActiveCenterY(active) {
  const r = active?.rect?.current;
  if (!r) return null;
  const top = r.translated?.top ?? r.top ?? r.initial?.top ?? null;
  const height = r.rect?.height ?? r.initial?.height ?? 0;
  if (top == null) return null;
  return top + height / 2;
}

/** 컬럼 내 포인터(Y) 기준 삽입 인덱스 계산 */
export function computeInsertIndexInColumn(dateKey, pointerY) {
  const container = document.querySelector(`[data-col="${dateKey}"]`);
  if (!container) return 0;
  const nodes = container.querySelectorAll(
    `[data-entry="card"][data-date="${dateKey}"]`
  );
  const len = nodes?.length ?? 0;
  if (!len) return 0;
  for (let i = 0; i < len; i++) {
    const rect = nodes[i].getBoundingClientRect();
    const mid = rect.top + rect.height / 2;
    if (pointerY < mid) return i;
  }
  return len;
}
