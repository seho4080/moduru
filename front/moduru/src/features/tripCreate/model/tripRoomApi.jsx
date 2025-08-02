// src/features/tripCreate/model/tripRoomApi.js

// 여행방 생성 API
export async function createTripRoom() {
  const res = await fetch("http://localhost:8080/rooms", {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) throw new Error("여행방 생성 실패");

  const data = await res.json();
  return data.travelRoomId;
}

// 여행방 정보 조회 API
export async function getTripRoomInfo(roomId) {
  const res = await fetch(`http://localhost:8080/rooms/${roomId}`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) throw new Error("여행방 정보 조회 실패");

  const data = await res.json();
  return data.title;
}

// 여행방 지역 업데이트 API
export async function updateTripRoomRegion(roomId, region) {
  const res = await fetch(`http://localhost:8080/rooms/${roomId}/update`, {
    method: "PATCH",
    headers: { 'Content-Type': 'application/json' },
    credentials: "include",
    body: JSON.stringify({ region }),
  });

  if (!res.ok) throw new Error("지역 업데이트 실패");

  const data = await res.json();
  return data;
}
