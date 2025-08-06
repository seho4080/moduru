export default function useLikedToggle() {
  const toggleLikedPlace = async (place, isLiked) => {
    try {
      const res = await fetch(
        `http://localhost:8080/my-places/${place.placeId}`,
        {
          method: 'POST',
          credentials: 'include', // NOTE: 쿠키 기반 인증을 위해 반드시 포함해야 함
        }
      );

      if (!res.ok) {
        throw new Error('좋아요 토글 실패');
      }

      // NOTE: 서버는 토글만 처리하고, 실제 메시지는 프론트에서 상황에 맞게 출력
      const message = isLiked
        ? 'My 장소에서 삭제되었습니다.'
        : 'My 장소에 추가되었습니다.';

      console.log(message, {
        장소명: place.placeName,
        지역: place.region,
        카테고리: place.category,
      });

      return true;
    } catch (err) {
      console.error('좋아요 토글 실패', {
        message: err.message,
        장소명: place.placeName,
        지역: place.region,
        카테고리: place.category,
      });

      return false;
    }
  };

  return { toggleLikedPlace };
}
