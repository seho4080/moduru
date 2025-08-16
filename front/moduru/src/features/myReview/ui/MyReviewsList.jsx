import React, { useEffect, useState, useMemo } from "react";
import { getMyReviews, deleteMyReview } from "../lib/myReviewApi";
import { FaTrash, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./myReviewsList.css";

/* ===== 태그 내부 페이지네이션(그대로 사용, 간격만 CSS에서 줄임) ===== */
const TagPagination = ({ tags }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const TAGS_PER_PAGE = 8; // 2줄 x 4개
  const totalPages = Math.ceil(tags.length / TAGS_PER_PAGE);
  
  if (!tags || tags.length === 0) return null;
  
  const startIndex = currentPage * TAGS_PER_PAGE;
  const endIndex = startIndex + TAGS_PER_PAGE;
  const currentTags = tags.slice(startIndex, endIndex);
  
  const nextPage = () => setCurrentPage((prev) => (prev + 1) % totalPages);
  const prevPage = () => setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  
  return (
    <div className="tags-container">
      <div className="tags-content">
        <div className="tags-grid">
          {currentTags.map((tag, idx) => (
            <span key={`${startIndex + idx}`} className="myreviews-tag">
              {tag}
            </span>
          ))}
        </div>
        
        {totalPages > 1 && (
          <div className="tags-pagination">
            <button onClick={prevPage} className="pagination-btn prev-btn" aria-label="이전 태그들">
              <FaChevronLeft size={14} />
            </button>
            <button onClick={nextPage} className="pagination-btn next-btn" aria-label="다음 태그들">
              <FaChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function MyReviewsList() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // ===== 목록 페이지네이션: 4개씩 =====
  const PAGE_SIZE = 4;
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyReviews();
        const arr = Array.isArray(data) ? data : [];
        setReviews(arr);
        setPage(1); // 새로고침 시 1페이지
      } catch (error) {
        console.error("리뷰 조회 실패:", error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalPages = Math.max(1, Math.ceil(reviews.length / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const start = (page - 1) * PAGE_SIZE;
  const viewReviews = useMemo(() => reviews.slice(start, start + PAGE_SIZE), [reviews, start]);

  const go = (p) => setPage(Math.min(Math.max(1, p), totalPages));

  const handleDelete = async (id) => {
    if (!window.confirm("이 리뷰를 삭제할까요?")) return;
    setDeletingId(id);
    try {
      await deleteMyReview(id);
      setReviews((prev) => prev.filter((r) => r.reviewId !== id));
    } catch (err) {
      console.error("리뷰 삭제 실패:", err);
      alert("삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  if (loading) return <div className="myreviews-loading">로딩 중...</div>;

  if (!reviews.length) {
    return (
      <div className="no-review-msg">
        <p className="no-review-title">아직 작성한 리뷰가 없어요</p>
      </div>
    );
  }

  return (
    <div className="myreviews-container">
      {viewReviews.map((review) => (
        <div key={review.reviewId} className="myreviews-card">
          <div className="card-header">
            <span className="region-badge">지역</span>
            <h3 className="place-name">{review.placeName}</h3>
            <span className="review-date">{formatDate(review.createdAt)}</span>
            <button
              type="button"
              className="delete-btn"
              aria-label="리뷰 삭제"
              disabled={deletingId === review.reviewId}
              onClick={() => handleDelete(review.reviewId)}
              title="삭제"
            >
              <FaTrash />
            </button>
          </div>
          
          <TagPagination tags={review.tags || []} />
        </div>
      ))}

      {/* ===== 아래 목록 페이지네이션 UI ===== */}
      <div className="reviews-pagination" role="navigation" aria-label="리뷰 페이지네이션">
        <button className="rv-pg-btn" onClick={() => go(1)} disabled={page === 1} aria-label="첫 페이지">«</button>
        <button className="rv-pg-btn" onClick={() => go(page - 1)} disabled={page === 1} aria-label="이전">‹</button>

        {/* 숫자 버튼 2개 윈도우 (page, page+1), 끝에서는 (last-1, last) */}
        {(() => {
          const WINDOW = 2;
          const startWin = Math.max(1, Math.min(page, totalPages - WINDOW + 1));
          const endWin = Math.min(totalPages, startWin + WINDOW - 1);
          const arr = [];
          for (let i = startWin; i <= endWin; i += 1) arr.push(i);
          return arr.map((p) => (
            <button
              key={p}
              className={`rv-pg-btn ${p === page ? "is-active" : ""}`}
              onClick={() => go(p)}
            >
              {p}
            </button>
          ));
        })()}

        <button className="rv-pg-btn" onClick={() => go(page + 1)} disabled={page === totalPages} aria-label="다음">›</button>
        <button className="rv-pg-btn" onClick={() => go(totalPages)} disabled={page === totalPages} aria-label="끝 페이지">»</button>
      </div>
    </div>
  );
}
