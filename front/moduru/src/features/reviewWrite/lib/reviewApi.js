// src/features/reviewWrite/lib/reviewApi.js
import api from '../../../lib/axios';

/**
 * NOTE: 카테고리별 태그 가져오기
 * GET /review-tags/category/{categoryId}
 */
export async function getReviewTagsByCategory(categoryId) {
  const res = await api.get(`/review-tags/category/${categoryId}`, {
    withCredentials: true,
    useToken: false,
  });

  const raw = Array.isArray(res.data)
    ? res.data
    : Array.isArray(res.data?.data)
    ? res.data.data
    : [];

  const normalize = (t) => ({
    id: t?.id ?? null,
    // v2 평탄화 + v1 중첩 대응
    categoryId: t?.categoryId ?? t?.category?.id ?? null,
    categoryName: t?.categoryName ?? t?.category?.categoryName ?? null,
    content: t?.content ?? '',
  });

  return raw.map(normalize);
}

/**
 * NOTE: 여행방 일정 장소 조회
 * GET /rooms/{roomId}/schedules/places
 * 응답 예: [{ placeId:number, placeName:string, address:string, categoryId?:number, categoryName?:string }]
 * 반환:   [{ id:number, name:string, address:string, categoryId:number|null, categoryName:string }]
 */
export async function getRoomSchedulePlaces(roomId) {
  const idNum = Number(roomId);
  if (!Number.isInteger(idNum) || idNum <= 0) {
    throw new Error('유효한 roomId가 필요합니다.');
  }

  try {
    const res = await api.get(`/rooms/${idNum}/schedules/places`, {
      withCredentials: true,
      useToken: true,
    });

    const raw = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.data)
      ? res.data.data
      : [];

    return raw.map((p) => ({
      id: p?.placeId ?? p?.id ?? null, // 리뷰 제출용 placeId
      name: p?.placeName ?? p?.name ?? '',
      address: p?.address ?? p?.roadAddress ?? '',
      categoryId: p?.categoryId ?? p?.category?.id ?? null,
      categoryName: p?.categoryName ?? p?.category?.categoryName ?? '',
    }));
  } catch (err) {
    const status = err?.response?.status;
    const msg =
      err?.response?.data ??
      (status === 401
        ? '인증이 필요합니다'
        : status === 404
        ? '해당 방 또는 일정이 존재하지 않습니다'
        : '서버 내부 오류');

    throw new Error(typeof msg === 'string' ? msg : '일정 장소 조회 실패');
  }
}

/**
 * NOTE: 리뷰 작성
 * POST /reviews
 * body: { placeId: number, tagIds: number[] }
 * 200: 성공(string 메시지)
 */
export async function createReview({ placeId, tagIds }) {
  const pid = Number(placeId);
  if (!Number.isInteger(pid) || pid <= 0 || !Array.isArray(tagIds)) {
    throw new Error('placeId와 tagIds가 올바르지 않습니다.');
  }

  try {
    const res = await api.post(
      `/reviews`,
      { placeId: pid, tagIds },
      {
        withCredentials: true,
        useToken: true,
      }
    );
    return res.data;
  } catch (err) {
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
