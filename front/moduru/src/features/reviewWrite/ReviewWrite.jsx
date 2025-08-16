// src/features/reviewWrite/ReviewWrite.jsx
import React, { useRef, useState, useEffect } from "react";
import "./reviewWrite.css";
import StepTitle from "./ui/StepTitle";
import SelectBox from "./ui/SelectBox";
import DropdownPanel from "./ui/DropdownPanel";
import ReviewTags from "./ui/ReviewTags";
import { createReview } from "./lib/reviewApi";

export default function ReviewWrite({
  open,
  onClose,
  onStart,
  fetchTrips,          // () => Promise<{id,title,period}[]>
  fetchPlacesByTrip,   // (tripId) => Promise<{id,name,address}[]>
  initialTrip,         // { id, title, period } | null
}) {
  if (!open) return null;

  const [activeTab, setActiveTab] = useState(0); // 0=닫힘, 1=step1, 2=step2
  const [trips, setTrips] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);     // 리스트 로딩
  const [error, setError] = useState("");

  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedKeywords, setSelectedKeywords] = useState([]); // 문자열 or 객체 혼재 가능

  const [submitting, setSubmitting] = useState(false);

  const overlayRef = useRef(null);
  // 토글 막는 코드
  const isTripLocked = !!initialTrip?.id;
  // ====== 초기 프리셀렉트 처리 ======
  useEffect(() => {
    if (!open) return;
    if (initialTrip?.id) {
      setSelectedTrip(initialTrip);
      setSelectedPlace(null);
      setSelectedKeywords([]);
      setActiveTab(0); // 필요시 2로 열고 자동 로드하고 싶으면 아래 주석 참고
      // if (fetchPlacesByTrip) {
      //   (async () => {
      //     setLoading(true); setError("");
      //     try {
      //       const list = await fetchPlacesByTrip(initialTrip.id);
      //       setPlaces(Array.isArray(list) ? list : []);
      //       setActiveTab(2);
      //     } catch { setError("장소 목록을 불러오지 못했습니다."); }
      //     finally { setLoading(false); }
      //   })();
      // }
    }
  }, [open, initialTrip, fetchPlacesByTrip]);

  // ESC로 닫기
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onOverlayClick = (e) => { if (e.target === overlayRef.current) onClose?.(); };

  // step 토글 시 데이터 로딩
  const toggleOpen = async (step) => {
    if (step === 1 && isTripLocked) return; // step1 잠금
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

  // 작성 버튼 활성화 조건: 여행 + 장소 + 키워드 ≥ 1
  const canSubmit = !!selectedTrip && !!selectedPlace && selectedKeywords.length > 0 && !submitting;

  // 유틸: 태그 배열에서 id 추출(객체/숫자/문자열 혼재 대응)
  const toId = (x) => {
    if (x == null) return null;
    if (typeof x === "object") return x.id ?? x.tagId ?? null;
    const n = Number(x);
    return Number.isFinite(n) ? n : null;
  };

  // 제출
  const submit = async () => {
    if (!canSubmit) return;

    const tagIds = [...new Set(selectedKeywords.map(toId).filter(Boolean))];
    const payload = {
      tripId: selectedTrip.id,          // 백엔드가 필요 없다면 무시됨
      placeId: selectedPlace.id,
      ...(tagIds.length > 0 ? { tagIds } : { tags: selectedKeywords }), // id가 있으면 id 우선
    };

    try {
      setSubmitting(true);
      const res = await createReview(payload);
      console.log("[리뷰 작성 성공]", res);
      onStart?.({ trip: selectedTrip, place: selectedPlace, tagIds, tags: selectedKeywords });
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
    // 🔒 잠금 모드: 정적 표시만 (클릭/토글 없음)
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
                    <li key={p.id}>
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
              enabled={!!selectedTrip && !!selectedPlace}
              selected={selectedKeywords}
              onChange={setSelectedKeywords}
              categoryId={1} // 현재 요청: 1 고정
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
