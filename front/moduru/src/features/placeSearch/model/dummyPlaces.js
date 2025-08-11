// src/features/placeSearch/model/dummyPlaces.js
const categories = ["all", "restaurant", "spot", "festival"];

export const dummyPlaces = Array.from({ length: 100 }, (_, i) => {
  const placeId = i + 1;
  const category = categories[Math.floor(Math.random() * categories.length)];
  return {
    placeId,
    placeName: `Place ${placeId}`,
    placeImg: `https://picsum.photos/seed/place${placeId}/300/200`,
    category, // 서버 스키마 맞춤 (영문 코드)
    address: `Sample Address ${placeId}`,
    latitude: 35 + Math.random() * 5,
    longitude: 126 + Math.random() * 5,
    isLiked: Math.random() < 0.5,
    isWanted: Math.random() < 0.5,
  };
});
