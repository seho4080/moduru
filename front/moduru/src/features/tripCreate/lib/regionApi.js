// src/features/tripCreate/lib/regionApi.js
import api from '../../../lib/axios';

/**
 * NOTE: 최상위 지역(시·도) 목록 조회
 * - GET /rooms/regions     // parentId 미전달
 */
export async function fetchTopRegions() {
  const res = await api.get('/rooms/regions', {
    withCredentials: true,
    useToken: true,
  });
  // NOTE: 예상 응답: [{ id, name, lat, lng, parentId:null }, ...]
  return Array.isArray(res?.data) ? res.data : [];
}

/**
 * NOTE: 하위 지역(시·군·구) 목록 조회
 * - GET /rooms/regions?parentId={id}
 */
export async function fetchChildRegions(parentId) {
  if (parentId === undefined || parentId === null) return [];
  const res = await api.get('/rooms/regions', {
    params: { parentId },
    withCredentials: true,
    useToken: true,
  });
  return Array.isArray(res?.data) ? res.data : [];
}
