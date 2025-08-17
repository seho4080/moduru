// src/shared/hooks/useAutoPageSize.js
import { useCallback, useEffect, useLayoutEffect, useState } from "react";

/**
 * 스크롤 영역 높이와 항목 평균 높이를 측정해,
 * 하단 페이지네이션과 겹치지 않는 최대 itemsPerPage를 계산한다.
 *
 * @param {Object} params
 * @param {React.RefObject} scrollRef - 스크롤 영역(.main-scroll) ref
 * @param {React.RefObject} paginationRef - 하단 바(.pagination-bar) ref
 * @param {string} itemSelector - 항목 요소 선택자(예: ".room-item")
 * @param {number} minItems - 최소 개수 보정
 * @param {number} maxItems - 최대 개수 제한
 * @param {number} gapPx - 항목 간격(px)
 */
export default function useAutoPageSize({
  scrollRef,
  paginationRef,
  itemSelector,
  minItems = 5,
  maxItems = 50,
  gapPx = 12,
}) {
  const [itemsPerPage, setItemsPerPage] = useState(minItems);

  const compute = useCallback(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    const pagEl = paginationRef?.current || null;
    const pagH = pagEl ? pagEl.getBoundingClientRect().height : 56; // 추정 높이

    const scrollRect = scrollEl.getBoundingClientRect();
    const availableHeight = scrollRect.height - pagH - 8; // 여유 8px

    const items = scrollEl.querySelectorAll(itemSelector);
    if (!items || items.length === 0) {
      setItemsPerPage(minItems);
      return;
    }

    const sampleCount = Math.min(items.length, 5);
    let sum = 0;
    for (let i = 0; i < sampleCount; i++) sum += items[i].getBoundingClientRect().height;
    const avgItemH = sum / sampleCount;

    const unit = avgItemH + gapPx;
    if (unit <= 0 || !Number.isFinite(unit)) {
      setItemsPerPage(minItems);
      return;
    }

    const fit = Math.max(minItems, Math.min(maxItems, Math.floor(availableHeight / unit)));
    setItemsPerPage(fit);
  }, [gapPx, maxItems, minItems, paginationRef, scrollRef]);

  useLayoutEffect(() => {
    compute();
    const ro = new ResizeObserver(() => compute());
    if (scrollRef.current) ro.observe(scrollRef.current);
    return () => ro.disconnect();
  }, [compute]);

  useEffect(() => {
    const onResize = () => compute();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [compute]);

  return itemsPerPage;
}
