// src/features/PlaceDetail/lib/placeDetailApi.jsx
import api from '../../../lib/axios';

export async function getPlaceDetail(roomId, placeId) {
  if (!roomId || !placeId) {
    // NOTE: 필수 파라미터가 누락되면 즉시 실패 처리
    throw new Error('roomId와 placeId는 필수입니다.');
  }
  try {
      const res = await api.get(`/places/${roomId}/detail`, {
        params: { placeId },          // ?placeId=...
        withCredentials: true,        // 쿠키 인증 필요 시
        // useToken: true,            // 토큰도 필요하면 켜기
      });
      return res.data;                // axios는 자동으로 JSON 파싱
    } catch (err) {
      // 네트워크 오류 vs HTTP 오류 구분
      if (!err.response) {
        throw new Error('네트워크 오류로 요청을 보낼 수 없습니다.');
      }
      const status = err.response.status;
      const message = err.response?.data?.message;
      throw new Error(message || `장소 상세 정보 호출 실패: ${status}`);
    }
}
