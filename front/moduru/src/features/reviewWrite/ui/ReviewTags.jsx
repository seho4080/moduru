// src/features/reviewWrite/ui/ThemeTags.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getReviewTagsByCategory } from "../lib/reviewApi";
import "../../reviewWrite/reviewWrite.css"; // 칩 스타일 재사용

export default function ReviewTags({
  enabled,            // step1, step2 완료 여부
  selected = [],      // 선택된 content 배열
  onChange,           // (nextSelected) => void
  categoryId = 1,     // API 카테고리(고정 1)
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [tags, setTags]       = useState([]); // 원본

  useEffect(() => {
    if (!enabled || categoryId == null) {
      setTags([]);            // 비활성/미지정 시 정리 (원하면 유지해도 됨)
      return;
    }

    const ac = new AbortController();
    let alive = true;

    setLoading(true);
    setError("");

    getReviewTagsByCategory(categoryId, { signal: ac.signal })
      .then((data) => {
        if (!alive) return;
        setTags(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!alive) return;
        // axios v1: abort 시 CanceledError / DOMException("AbortError")
        if (e.name === "CanceledError" || e.name === "AbortError") return;
        setError("태그를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
      ac.abort(); // 🔴 이전 요청 취소
    };
  }, [enabled, categoryId]);

  const { commonTags, themedTags } = useMemo(() => {
    const common = tags.filter(t => t.categoryId === 4);
    const themed = tags.filter(t => t.categoryId === 1);
    return { commonTags: common, themedTags: themed };
  }, [tags]);

  const toggle = (content) => {
    const has = selected.includes(content);
    const next = has ? selected.filter(x => x !== content) : [...selected, content];
    onChange?.(next);
  };

  if (!enabled) return <div className="rw-meta text-sm text-gray-500">여행과 장소를 먼저 선택하세요.</div>;
  if (loading)  return <div className="rw-meta text-sm text-gray-500">불러오는 중…</div>;
  if (error)    return <div className="rw-meta text-sm text-red-600">{error}</div>;

  return (
    <div className="flex flex-col gap-4">
      {commonTags.length > 0 && (
        <TagGroup title="자주 쓰는 키워드" items={commonTags} selected={selected} onToggle={toggle} />
      )}
      {themedTags.length > 0 && (
        <TagGroup title="테마별 테그" items={themedTags} selected={selected} onToggle={toggle} />
      )}
      {commonTags.length === 0 && themedTags.length === 0 && (
        <div className="rw-meta text-sm text-gray-500">표시할 태그가 없습니다.</div>
      )}
    </div>
  );
}

function TagGroup({ title, items, selected, onToggle }) {
  return (
    <div className="rw-tag-group">
      <div className="rw-tag-title">{title}</div>
      <div className="flex flex-wrap">
        {items.map(tag => {
          const active = selected.includes(tag.content);
          return (
            <button
              key={tag.id ?? tag.content}
              type="button"
              onClick={() => onToggle(tag.content)}
              className={`rw-chip ${active ? "rw-chip--active" : "rw-chip--idle"}`}
              title={tag.content}
            >
              {tag.content}
            </button>
          );
        })}
      </div>
    </div>
  );
}
