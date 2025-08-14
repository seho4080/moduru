// src/features/myReview/ui/MyReviewsList.jsx
import React, { useEffect, useState } from "react";
import { getMyReviews, deleteMyReview } from "../lib/myReviewApi";
import { FaTrash } from "react-icons/fa";
import "./myReviewsList.css";

export default function MyReviewsList() {
  const USE_MOCK = true; // 데이터 붙기 전까지 true

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyReviews({ useMock: USE_MOCK }); // 목업 삭제
        setReviews(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("이 리뷰를 삭제할까요?")) return;
    setDeletingId(id);
    try {
      await deleteMyReview(id, { useMock: USE_MOCK }); // 목업 삭제
      setReviews((prev) => prev.filter((r) => r.reviewId !== id)); // 화면 즉시 반영
      console.log("[리뷰 삭제 성공]", id);
    } catch (err) {
      console.error("[리뷰 삭제 실패]", err?.response?.data || err);
      alert("삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
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
        <div key={review.reviewId} className="myreviews-card relative">
          <button
            type="button"
            className="absolute top-2 right-2 text-gray-400 disabled:opacity-40"
            aria-label="리뷰 삭제"
            disabled={deletingId === review.reviewId}
            onClick={() => handleDelete(review.reviewId)}
            title="삭제"
          >
            <FaTrash />
          </button>

          <div className="myreviews-image">
            {review.imageUrl ? (
              <img
                src={review.imageUrl}
                alt={review.placeName}
                className="object-cover w-[120px] h-[90px] rounded-md"
              />
            ) : (
              <div className="flex w-[120px] h-[90px] items-center justify-center rounded-md bg-slate-100 text-xs text-slate-500">
                이미지 없음
              </div>
            )}
          </div>

          <div className="myreviews-info">
            <h3 className="myreviews-place-name">{review.placeName}</h3>
            <div className="myreviews-tags">
              {(review.tags || []).map((tag, idx) => (
                <span key={idx} className="myreviews-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
