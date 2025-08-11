import React, { useEffect, useRef, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import "./customPlace.css";
import { FaSearch } from "react-icons/fa";
import { searchKakaoPlaces, createCustomPlace } from "../lib/placeApi";
import SearchResultList from "./SearchResultList";
import ConfirmPlaceModal from "./ConfirmPlaceModal";

export default function CustomPlace({
  open = true,
  roomId,                     // 상위에서 주는 값(선택)
  onPin,                      // 지도에 핀 꽂기({lat,lng,name,address})
  onDisablePinMode,           // 핀모드 해제 콜백(선택)
  onClose,
  placeholder = "상호명 또는 주소를 입력하세요",
  minChars = 1,
  height = "320px",
}) {
  if (!open) return null;

  const { id: idFromUrl } = useParams();
  const roomIdSafe = useMemo(() => {
    const v = roomId ?? idFromUrl;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }, [roomId, idFromUrl]);

  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showNoResultModal, setShowNoResultModal] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState(null); // {name,address,lat,lng}
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitErr, setSubmitErr] = useState("");

  const inputRef = useRef(null);
  const modalRef = useRef(null);
  const dragData = useRef({ dragging: false, dx: 0, dy: 0 });

  const runSearch = async () => {
    if (q.trim().length < minChars) return;
    setLoading(true);
    try {
      const raw = await searchKakaoPlaces(q.trim());
      console.log("[CustomPlace] 받은 리스트", raw);
      const list = raw.map((it) => ({
        id: it.id,
        title: it.name,
        subtitle: it.addressName || it.roadAddressName || "",
        _raw: it,
      }));
      setResults(list);
      setHasSearched(true);
      setShowNoResultModal(list.length === 0);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await runSearch();
  };

  const onBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  // 모달 드래그
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    const handle = modal.querySelector(".sbx-modal-head");
    if (!handle) return;

    const onDown = (e) => {
      dragData.current.dragging = true;
      const rect = modal.getBoundingClientRect();
      dragData.current.dx = e.clientX - rect.left;
      dragData.current.dy = e.clientY - rect.top;
      modal.classList.add("dragging");
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    };
    const onMove = (e) => {
      if (!dragData.current.dragging) return;
      modal.style.left = `${e.clientX - dragData.current.dx}px`;
      modal.style.top = `${e.clientY - dragData.current.dy}px`;
      modal.style.position = "fixed";
      modal.style.transform = "none";
    };
    const onUp = () => {
      dragData.current.dragging = false;
      modal.classList.remove("dragging");
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    handle.addEventListener("mousedown", onDown);
    return () => handle.removeEventListener("mousedown", onDown);
  }, []);

  const noResult = hasSearched && results.length === 0;

  // “예” 클릭: 즉시 핀 꽂고, 핀모드 해제 → 서버 등록 백그라운드
  const handleConfirmYes = async () => {
    if (!confirmData) return;

    // 1) 즉시 핀 꽂기
    onPin?.({
      name: confirmData.name,
      address: confirmData.address,
      lat: confirmData.lat,
      lng: confirmData.lng,
      optimistic: true,
    });

    // 2) 핀모드 해제
    onDisablePinMode?.();

    // 3) 모달 닫기(검색 모달도 닫고 싶으면 유지)
    setConfirmOpen(false);
    onClose?.();

    // 4) 서버 등록(백그라운드)
    if (!roomIdSafe) {
      console.warn("[createCustomPlace] roomId 없음 → 서버 등록 생략");
      return;
    }
    try {
      setSubmitLoading(true);
      setSubmitErr("");

      const payload = {
        roomId: roomIdSafe,
        name: confirmData.name,
        lat: confirmData.lat,
        lng: confirmData.lng,
        address: confirmData.address,
      };
      console.log("[CustomPlace → createCustomPlace 호출]", payload);

      const res = await createCustomPlace(payload);
      console.log("[createCustomPlace 응답]", res);

      if (!res.success) {
        setSubmitErr(res.message || "등록 실패"); // 필요시 토스트 등
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <>
      <div className="sbx-backdrop" onClick={onBackdropClick} />
      <div
        className="sbx-modal-card"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sbx-title"
      >
        <div className="sbx-modal-head">
          <span id="sbx-title" className="sbx-title">주소 검색</span>
          <button className="sbx-close" onClick={onClose} aria-label="닫기">✕</button>
        </div>

        <form className="sbx-input-wrap" onSubmit={handleSubmit}>
          <input
            className="sbx-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            aria-label="검색어 입력"
            ref={inputRef}
          />
          <button
            type="button"
            className="sbx-icon-btn"
            onClick={runSearch}
            aria-label="검색"
          >
            <FaSearch style={{ marginRight: 4 }} />
          </button>
        </form>

        <SearchResultList
          results={results}
          loading={loading}
          hasSearched={hasSearched}
          height={height}
          emptyHint={roomIdSafe ? "검색어를 입력해주세요." : "여행 방이 확인되어야 등록할 수 있어요."}
          onItemClick={(item) => {
            const raw = item._raw;
            setConfirmData({
              name: raw.name,
              address: raw.roadAddressName || raw.addressName || "",
              lat: Number(raw.lat),
              lng: Number(raw.lng),
            });
            setSubmitErr("");
            setConfirmOpen(true);
          }}
        />
      </div>

      <ConfirmPlaceModal
        open={confirmOpen}
        name={confirmData?.name}
        address={confirmData?.address}
        lat={confirmData?.lat}
        lng={confirmData?.lng}
        loading={submitLoading}
        error={submitErr || (!roomIdSafe ? "여행 방 ID가 없어 등록할 수 없습니다." : "")}
        onClose={() => setConfirmOpen(false)}
        onReject={() => setConfirmOpen(false)}
        onConfirm={handleConfirmYes}
      />

      {showNoResultModal && noResult && (
        <>
          <div
            className="sbx-nores-backdrop"
            onClick={() => setShowNoResultModal(false)}
          />
          <div className="sbx-nores" role="alertdialog" aria-labelledby="sbx-nores-title">
            <h4 id="sbx-nores-title" className="sbx-nores-title">검색 결과가 없습니다.</h4>
            <p className="sbx-nores-desc">다른 키워드로 다시 시도해 주세요.</p>
            <div className="sbx-nores-actions">
              <button
                type="button"
                className="sbx-nores-btn"
                onClick={() => {
                  setShowNoResultModal(false);
                  inputRef.current?.focus();
                }}
              >
                확인
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
