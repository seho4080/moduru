import { useCallback, useMemo, useState } from "react";
import { searchPlacesByKeyword } from "../lib/keywordSearchApi";

/**
 * NOTE: 키워드 검색 상태/동작 제공
 * - isKeywordMode: true면 카테고리 탭 숨기고 검색 결과만 표시
 * - onSubmit: 엔터/돋보기 클릭 시 호출
 * - onChange: 입력값 변경
 * - clear: 입력/결과 초기화(탭 복귀)
 */
export function useKeywordSearch(roomId) {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  const isKeywordMode = useMemo(() => keyword.trim().length > 0, [keyword]);

  const onChange = useCallback((e) => {
    const v = typeof e === "string" ? e : e?.target?.value ?? "";
    setKeyword(v);
    setError("");
    // NOTE: 빈 문자열로 돌아오면 검색 모드 해제되지만, 결과는 유지하지 않음
    if (!v.trim().length) setResults([]);
  }, []);

  const onSubmit = useCallback(
    async (forceKeyword) => {
      const kw = String(forceKeyword ?? keyword).trim();
      if (!kw.length) return;
      setLoading(true);
      setError("");
      const { success, places, error: err } = await searchPlacesByKeyword(roomId, kw);
      setLoading(false);
      if (!success) {
        setResults([]);
        setError(err ?? "검색 중 오류가 발생했습니다.");
        return;
      }
      setResults(places);
    },
    [roomId, keyword]
  );

  const clear = useCallback(() => {
    setKeyword("");
    setResults([]);
    setError("");
  }, []);

  return {
    keyword,
    isKeywordMode,
    loading,
    results,
    error,
    onChange,
    onSubmit,
    clear,
  };
}
