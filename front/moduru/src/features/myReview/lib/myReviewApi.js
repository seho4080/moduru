// // src/features/myreviews/lib/reviewApi.js
// import api from "../../../lib/axios";

// // 리뷰 목록 조회
// export async function getMyReviews() {
//   const res = await api.get("/reviews/my", {
//     withCredentials: true,
//     useToken: true, // 로그인 필요
//   });
//   return res.data ?? [];
// }

// // 리뷰 삭제
// export async function deleteMyReview(reviewId) {
//   const res = await api.delete(`/reviews/${reviewId}`, {
//     withCredentials: true,
//     useToken: true, // 로그인 필요
//   });
//   return res.data;
// }


// src/features/myReview/lib/myReviewApi.js
import api from "../../../lib/axios";

export const MOCK_MY_REVIEWS = [
  { reviewId: 101, placeId: 9001, placeName: "협재해변", createdAt: "2024-04-15T10:00:00Z", tags: ["사진이 잘 나와요","분위기가 좋아요","바다뷰"], imageUrl: null },
  { reviewId: 102, placeId: 9002, placeName: "광안리 해수욕장", createdAt: "2023-10-03T15:30:00Z", tags: ["야경이 멋져요","산책하기 좋아요"], imageUrl: null },
  { reviewId: 103, placeId: 9003, placeName: "성산일출봉", createdAt: "2024-07-21T08:20:00Z", tags: ["경치가 좋아요","등산코스","포토스팟"], imageUrl: null },
];

/** 내 리뷰 목록 */
export async function getMyReviews({ useMock = false } = {}) {
  if (useMock) return [...MOCK_MY_REVIEWS];
  try {
    const res = await api.get("/reviews/my", { withCredentials: true, useToken: true });
    const data = res?.data ?? [];
    return Array.isArray(data) ? data : [];
  } catch {
    // 서버 불안정 시에도 화면 보려고 목업 반환
    return [...MOCK_MY_REVIEWS];
  }
}

/** 리뷰 삭제 */
export async function deleteMyReview(reviewId, { useMock = false } = {}) {
  if (useMock) {
    // 목업 모드: 서버 호출 없이 즉시 성공 응답 시뮬레이션
    return Promise.resolve({ message: `deleted mock ${reviewId}` });
  }
  const res = await api.delete(`/reviews/${reviewId}`, {
    withCredentials: true,
    useToken: true,
  });
  return res.data; // 서버 메시지
}
