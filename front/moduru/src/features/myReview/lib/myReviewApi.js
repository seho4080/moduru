// src/features/myReview/lib/myReviewApi.js
import api from '../../../lib/axios';

/** 내 리뷰 목록 조회 (쿠키 인증) */
export const getMyReviews = async (params = {}) => {
  try {
    const res = await api.get('/reviews/my', {
      params,
      withCredentials: true, // 쿠키만
      useToken: false,       // Authorization 제거
    });
    const data = res.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    const status = error?.response?.status;

    if (status === 401) throw new Error('인증되지 않은 사용자');
    if (status === 404) throw new Error('리뷰를 찾을 수 없습니다');
    if (status === 500) throw new Error('서버 오류가 발생했습니다');

    throw new Error(error?.response?.data?.message || '리뷰 조회에 실패했습니다');
  }
};

/** 리뷰 삭제 (쿠키 인증) */
export const deleteMyReview = async (reviewId) => {
  try {
    const res = await api.delete(`/reviews/${reviewId}`, {
      withCredentials: true, // 쿠키만
      useToken: false,       // Authorization 제거
    });

    // 서버가 204 No Content를 줄 수 있음
    if (res.status === 204) return { success: true };
    return res.data ?? { success: true };
  } catch (error) {
    const status = error?.response?.status;

    if (status === 401) throw new Error('인증되지 않은 사용자');
    if (status === 403) throw new Error('삭제 권한이 없습니다');
    if (status === 404) throw new Error('리뷰를 찾을 수 없습니다');
    if (status === 500) throw new Error('서버 오류가 발생했습니다');

    throw new Error(error?.response?.data?.message || '리뷰 삭제에 실패했습니다');
  }
};
