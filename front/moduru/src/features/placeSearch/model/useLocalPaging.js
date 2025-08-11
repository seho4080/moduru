// src/features/placeSearch/model/useLocalPaging.js
import { useMemo, useState, useEffect, useCallback } from "react";

export default function useLocalPaging(items = [], pageSize = 20) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [items, pageSize]);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const slice = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const go = useCallback(
    (p) => setPage(Math.min(Math.max(1, p), totalPages)),
    [totalPages]
  );
  const prev = useCallback(() => hasPrev && setPage((v) => v - 1), [hasPrev]);
  const next = useCallback(() => hasNext && setPage((v) => v + 1), [hasNext]);

  return {
    page,
    totalPages,
    total,
    pageSize,
    slice,
    hasPrev,
    hasNext,
    prev,
    next,
    go,
  };
}
