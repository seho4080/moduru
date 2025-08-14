// src/features/reviewWrite/lib/reviewApi.js
import api from '../../../lib/axios';

// NOTE: 카테고리별 태그 가져오기
export async function getReviewTagsByCategory(categoryId = 1) {
  const res = await api.get(`/review-tags/category/${categoryId}`, {
    withCredentials: true,
    useToken: false,
  });

  const raw = Array.isArray(res.data) ? res.data
            : Array.isArray(res.data?.data) ? res.data.data
            : [];

  const normalize = (t) => ({
    id: t?.id ?? null,
    // v2(평탄화): categoryId / categoryName
    // v1(중첩):    category.id / category.categoryName
    categoryId:  t?.categoryId ?? t?.category?.id ?? null,
    categoryName: t?.categoryName ?? t?.category?.categoryName ?? null,
    content: t?.content ?? "",
  });

  return raw.map(normalize);
}

/**
 * NOTE: 리뷰 작성
 * POST /reviews
 * body: { placeId: number, tagIds: number[] }
 * 200: 성공(string 메시지), 400/401/404/500: 에러 메시지
 */
export async function createReview({ placeId= 1, tagIds= [1, 2] }) {
  // 간단 유효성 검사
  if (!placeId || !Array.isArray(tagIds)) {
    throw new Error('placeId와 tagIds가 올바르지 않습니다.');
  }

  try {
    const res = await api.post(
      `/reviews`,
      { placeId, tagIds },
      {
        withCredentials: true, // 쿠키 인증 사용 시
        useToken: true,        // 인증 필요한 엔드포인트이므로 토큰 사용
      }
    );
    return res.data; // 서버가 반환하는 메시지(string)
  } catch (err) {
    // Axios 에러 안전 처리
    const status = err?.response?.status;
    const msg =
      err?.response?.data ??
      (status === 400
        ? '잘못된 요청 데이터'
        : status === 401
        ? '인증이 필요합니다'
        : status === 404
        ? '리뷰 대상 장소를 찾을 수 없습니다'
        : '서버 내부 오류');

    throw new Error(typeof msg === 'string' ? msg : '리뷰 작성 실패');
  }
}
