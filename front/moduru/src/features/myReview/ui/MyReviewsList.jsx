// src/features/myReview/ui/MyReviewsList.jsx
import React, { useEffect, useState } from "react";
import { getMyReviews, deleteMyReview } from "../lib/myReviewApi";
import { FaTrash, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./myReviewsList.css";

const TagPagination = ({ tags }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const TAGS_PER_PAGE = 8; // 2줄 x 4개
  const totalPages = Math.ceil(tags.length / TAGS_PER_PAGE);
  
  if (tags.length === 0) return null;
  
  const startIndex = currentPage * TAGS_PER_PAGE;
  const endIndex = startIndex + TAGS_PER_PAGE;
  const currentTags = tags.slice(startIndex, endIndex);
  
  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };
  
  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };
  
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
            <button 
              onClick={prevPage}
              className="pagination-btn prev-btn"
              aria-label="이전 태그들"
            >
              <FaChevronLeft size={14} />
            </button>
            <button 
              onClick={nextPage}
              className="pagination-btn next-btn"
              aria-label="다음 태그들"
            >
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

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyReviews();
        setReviews(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("리뷰 조회 실패:", error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
      {reviews.map((review) => (
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
    </div>
  );
}