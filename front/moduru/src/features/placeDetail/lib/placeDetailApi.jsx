// src/features/PlaceDetail/lib/placeDetailApi.jsx

export async function getPlaceDetail(roomId, placeId) {
  if (!roomId || !placeId) {
    // NOTE: 필수 파라미터가 누락되면 즉시 실패 처리
    throw new Error('roomId와 placeId는 필수입니다.');
  }

  let response;

  try {
    response = await fetch(
      `http://localhost:8080/places/${roomId}/detail?placeId=${placeId}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );
  } catch (networkError) {
    // NOTE: 브라우저에서 네트워크 자체가 실패한 경우
    throw new Error('네트워크 오류로 요청을 보낼 수 없습니다.');
  }

  if (!response.ok) {
    // NOTE: HTTP 레벨 오류 처리
    throw new Error(`장소 상세 정보 호출 실패: ${response.status}`);
  }

  let rawText;

  try {
    rawText = await response.text();
  } catch (e) {
    // NOTE: 응답 본문 파싱 전 텍스트 추출 실패
    throw new Error('응답에서 텍스트를 추출하지 못했습니다.');
  }

  try {
    return JSON.parse(rawText);
  } catch (e) {
    // NOTE: 응답이 JSON 형식이 아닐 경우
    throw new Error('응답을 JSON으로 파싱하지 못했습니다.');
  }
}
