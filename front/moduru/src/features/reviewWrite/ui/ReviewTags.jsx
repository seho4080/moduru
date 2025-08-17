import React, { useEffect, useMemo, useState } from "react";
import { getReviewTagsByCategory } from "../lib/reviewApi";
import "../../reviewWrite/reviewWrite.css"; // 칩 스타일 재사용

export default function ThemeTags({
  enabled,            // step1, step2 완료 여부
  selected = [],      // 선택된 content 문자열 배열
  onChange,           // (nextSelected: string[]) => void
  categoryId          // 선택된 장소의 카테고리 id
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [tags, setTags]       = useState([]); // [{id, content, categoryId, categoryName}]

  useEffect(() => {
    // 비활성 또는 카테고리 미지정 시 목록 비움
    if (!enabled || categoryId == null) {
      setTags([]);
      setError("");
      return;
    }

    let alive = true;
    setLoading(true);
    setError("");

    // reviewApi가 signal 옵션을 받지 않아도 무시되므로 안전
    (async () => {
      try {
        const data = await getReviewTagsByCategory(Number(categoryId));
        if (!alive) return;
        setTags(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!alive) return;
        setError("태그를 불러오지 못했습니다.");
        setTags([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [enabled, categoryId]);

  // ✅ 공통/테마 분리 로직: 공통(categoryId===4) + 현재 카테고리(categoryId===props.categoryId)
  const { commonTags, themedTags } = useMemo(() => {
    const catNum = Number(categoryId);
    const isCommon = (t) =>
      Number(t?.categoryId) === 4 ||
      String(t?.categoryName ?? "").toLowerCase().includes("공통");

    const isThemed = (t) => Number(t?.categoryId) === catNum;

    return {
      commonTags: tags.filter(isCommon),
      themedTags: tags.filter(isThemed),
    };
  }, [tags, categoryId]);

  const toggle = (content) => {
    const has = selected.includes(content);
    const next = has ? selected.filter((x) => x !== content) : [...selected, content];
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
        <TagGroup title="테마별 태그" items={themedTags} selected={selected} onToggle={toggle} />
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
        {items.map((tag) => {
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
