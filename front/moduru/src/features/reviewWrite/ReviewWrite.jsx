// src/features/reviewWrite/ReviewWrite.jsx
import React, { useRef, useState, useEffect } from "react";
import "./reviewWrite.css";
import StepTitle from "./ui/StepTitle";
import SelectBox from "./ui/SelectBox";
import DropdownPanel from "./ui/DropdownPanel";
import ReviewTags from "./ui/ReviewTags";
import { createReview, getReviewTagsByCategory } from "./lib/reviewApi";

export default function ReviewWrite({
  open,
  onClose,
  onStart,
  fetchTrips,          // () => Promise<{id,title,period}[]>
  fetchPlacesByTrip,   // (tripId) => Promise<{id,name,address,categoryId?}[]>
  initialTrip,         // { id, title, period } | null
}) {
  if (!open) return null;

  const [activeTab, setActiveTab] = useState(0); // 0=닫힘, 1=step1, 2=step2
  const [trips, setTrips] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedKeywords, setSelectedKeywords] = useState([]);

  const [submitting, setSubmitting] = useState(false);

  const overlayRef = useRef(null);
  const isTripLocked = !!initialTrip?.id;

  // 초기 프리셀렉트
  useEffect(() => {
    if (!open) return;
    if (initialTrip?.id) {
      setSelectedTrip(initialTrip);
      setSelectedPlace(null);
      setSelectedKeywords([]);
      setActiveTab(0);
    }
  }, [open, initialTrip, fetchPlacesByTrip]);

  // ESC로 닫기
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onOverlayClick = (e) => { if (e.target === overlayRef.current) onClose?.(); };

  // ----- 유틸: 태그 id/텍스트 추출 -----
  const toId = (x) => {
    if (x == null) return null;
    if (typeof x === "object") {
      const v = x.id ?? x.tagId ?? x.value;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
    const n = Number(x);
    return Number.isFinite(n) ? n : null;
  };
  const toText = (x) => {
    if (x == null) return "";
    if (typeof x === "object") {
      return String(x.content ?? x.label ?? x.name ?? "").trim().toLowerCase();
    }
    return String(x).trim().toLowerCase();
  };

  // tagIds 1차 해석 (숫자/객체에서 바로 뽑기)
  const getTagIdsQuick = (arr) =>
    [...new Set(arr.map(toId).filter((v) => Number.isFinite(v)))];

  // 2차 보정: content/label 텍스트로 카테고리 태그 목록과 매칭
  const resolveTagIds = async () => {
    // 1) 빠른 해석
    const quick = getTagIdsQuick(selectedKeywords);
    if (quick.length > 0) return quick;

    // 2) 카테고리 매칭
    const catId = selectedPlace?.categoryId;
    if (!catId) return [];

    try {
      const catalog = await getReviewTagsByCategory(catId); // [{id, content, ...}]
      const map = new Map(
        catalog
          .filter((t) => t?.id && t?.content)
          .map((t) => [String(t.content).trim().toLowerCase(), Number(t.id)])
      );

      const ids = [...new Set(
        selectedKeywords
          .map(toText)
          .map((txt) => map.get(txt))
          .filter((n) => Number.isFinite(n))
      )];

      return ids;
    } catch {
      return [];
    }
  };

  // step 토글 시 데이터 로딩
  const toggleOpen = async (step) => {
    if (step === 1 && isTripLocked) return;
    const willOpen = activeTab !== step ? step : 0;
    setActiveTab(willOpen);

    if (willOpen === 1 && fetchTrips) {
      setLoading(true); setError("");
      try {
        const list = await fetchTrips();
        setTrips(Array.isArray(list) ? list : []);
      } catch {
        setError("여행 목록을 불러오지 못했습니다.");
      } finally { setLoading(false); }
    }

    if (willOpen === 2 && fetchPlacesByTrip && (selectedTrip?.id != null)) {
      setLoading(true); setError("");
      try {
        const list = await fetchPlacesByTrip(selectedTrip.id);
        setPlaces(Array.isArray(list) ? list : []);
      } catch {
        setError("장소 목록을 불러오지 못했습니다.");
      } finally { setLoading(false); }
    }
  };

  // ✅ 버튼 활성화 조건: 예전처럼 '선택 개수' 기준 유지
  const canSubmit =
    !!selectedTrip &&
    !!selectedPlace &&
    selectedKeywords.length > 0 &&
    !submitting;

  // 제출
  const submit = async () => {
    if (!canSubmit) return;

    // tagIds를 안전하게 해석/보정
    const tagIds = await resolveTagIds();
    if (tagIds.length === 0) {
      alert("선택한 키워드에서 태그 번호를 찾지 못했어요. 다른 키워드를 선택해보세요.");
      return;
    }

    const payload = {
      tripId: selectedTrip.id,   // 백엔드에서 사용하지 않으면 무시됨
      placeId: selectedPlace.id,
      tagIds,                    // 항상 숫자 id 배열
    };

    try {
      setSubmitting(true);
      const res = await createReview(payload);
      console.log("[리뷰 작성 성공]", res);
      onStart?.({ trip: selectedTrip, place: selectedPlace, tagIds });
      onClose?.();
    } catch (e) {
      console.error("[리뷰 작성 실패]", e?.response?.data || e);
      alert("리뷰 저장에 실패했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="rw fixed inset-0 z-[1000] flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      onClick={onOverlayClick}
    >
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="rw-title">여행 경험 공유하기</h2>
          <button className="rounded-md p-1 text-gray-500" onClick={onClose} aria-label="닫기">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="max-h-[72vh] overflow-y-auto px-6 py-6">
          {/* step1 */}
          <section className="mb-8">
            <StepTitle title="step1. 여행지" />
            {isTripLocked ? (
              <div
                className="rw-item flex w-full items-center justify-between rounded-lg border px-3 py-3 bg-gray-50 cursor-default select-none"
                aria-disabled="true"
              >
                <div>
                  <div className="rw-item-title">
                    {selectedTrip?.title ?? initialTrip?.title ?? "여행"}
                  </div>
                  {(selectedTrip?.period ?? initialTrip?.period) && (
                    <div className="rw-meta">{selectedTrip?.period ?? initialTrip?.period}</div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <SelectBox
                  id="step1"
                  isOpen={activeTab === 1}
                  disabled={false}
                  label={selectedTrip ? selectedTrip.title : "여행을 선택하세요"}
                  description={selectedTrip?.period}
                  onClick={() => toggleOpen(1)}
                />
                {activeTab === 1 && (
                  <DropdownPanel loading={loading} error={error} emptyMessage="여행 기록이 없습니다.">
                    <ul className="divide-y">
                      {trips.map((t) => (
                        <li key={t.id}>
                          <button
                            className="rw-item flex w-full items-center justify-between px-3 py-3 text-left hover:bg-gray-50"
                            onClick={() => {
                              setSelectedTrip(t);
                              setSelectedPlace(null);
                              setSelectedKeywords([]);
                              setPlaces([]);
                              setActiveTab(0);
                            }}
                          >
                            <div>
                              <div className="rw-item-title">{t.title}</div>
                              {t.period && <div className="rw-meta">{t.period}</div>}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </DropdownPanel>
                )}
              </>
            )}
          </section>

          {/* step2 */}
          <section className="mb-8">
            <StepTitle title="step2. 장소" />
            <SelectBox
              id="step2"
              isOpen={activeTab === 2}
              disabled={!selectedTrip}
              label={
                selectedPlace
                  ? selectedPlace.name
                  : selectedTrip ? "장소를 선택하세요" : "여행을 먼저 선택하세요"
              }
              description={selectedPlace?.address}
              onClick={() => selectedTrip && toggleOpen(2)}
            />
            {activeTab === 2 && (
              <DropdownPanel
                loading={loading}
                error={error}
                emptyMessage={selectedTrip ? "방문 장소가 없습니다." : "여행을 먼저 선택하세요."}
              >
                <ul className="divide-y">
                  {places.map((p) => (
                    <li key={p.id ?? `${p.name}-${p.address}`}>
                      <button
                        className="rw-item flex w-full items-center justify-between px-3 py-3 text-left hover:bg-gray-50"
                        onClick={() => {
                          setSelectedPlace(p);
                          setSelectedKeywords([]); // 장소 변경 시 태그 초기화
                          setActiveTab(0);
                        }}
                      >
                        <div>
                          <div className="rw-item-title">{p.name}</div>
                          {p.address && <div className="rw-meta">{p.address}</div>}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </DropdownPanel>
            )}
          </section>

          {/* step3: 키워드 */}
          <section className="mb-6">
            <StepTitle title="step3. 키워드 선택" />
            <ReviewTags
              key={`rt-${selectedPlace?.categoryId ?? 'none'}`}  // ← 카테고리 바뀌면 강제 리마운트
              enabled={!!selectedTrip && !!selectedPlace}
              selected={selectedKeywords}
              onChange={setSelectedKeywords}
              categoryId={
                selectedPlace?.categoryId != null
                  ? Number(selectedPlace.categoryId)   // ← 숫자로 강제
                  : undefined
              }
            />
          </section>

        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
          <button
            className={`rw-btn-primary rounded-lg px-4 py-2 text-sm text-white ${
              canSubmit ? "bg-[#5c76c8] hover:bg-[#4a64b3]" : "bg-gray-300"
            }`}
            disabled={!canSubmit}
            onClick={submit}
          >
            {submitting ? "저장 중..." : "작성"}
          </button>
        </div>
      </div>
    </div>
  );
}
