// 여행방 생성 API
export async function createTripRoom() {
  const url = "http://localhost:8080/rooms";
  const token = localStorage.getItem("accessToken"); // ✅ JWT 가져오기
  console.log(`[🟢 createTripRoom] POST ${url}`);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`, // ✅ Authorization 헤더 추가
    },
  });

  console.log(`[🟡 응답 상태] ${res.status}`);

  const raw = await res.text();
  console.log(`[🟡 응답 원문]`, raw);

  if (!res.ok) {
    throw new Error(`여행방 생성 실패 (status: ${res.status})`);
  }

  try {
    const data = JSON.parse(raw);
    console.log(`[✅ travelRoomId]`, data.travelRoomId);
    return data.travelRoomId;
  } catch (err) {
    console.error("[❌ JSON 파싱 실패]", err);
    throw new Error("응답 파싱 실패");
  }
}

// 여행방 정보 조회 API
export async function getTripRoomInfo(roomId) {
  const url = `http://localhost:8080/rooms/${roomId}`;
  const token = localStorage.getItem("accessToken");
  console.log(`[🟢 getTripRoomInfo] GET ${url}`);

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log(`[🟡 응답 상태] ${res.status}`);

  const raw = await res.text();
  console.log(`[🟡 응답 원문]`, raw);

  if (!res.ok) {
    throw new Error(`여행방 정보 조회 실패 (status: ${res.status})`);
  }

  try {
    const data = JSON.parse(raw);
    console.log(`[✅ 여행방 정보]`, data);
    return data;
  } catch (err) {
    console.error("[❌ JSON 파싱 실패]", err);
    throw new Error("응답 파싱 실패");
  }
}

// 여행방 지역 업데이트 API
export async function updateTripRoomRegion(roomId, region) {
  const url = `http://localhost:8080/rooms/${roomId}/update`;
  const token = localStorage.getItem("accessToken");
  console.log(`[🟢 updateTripRoomRegion] PATCH ${url}`);
  console.log(`[📦 요청 데이터]`, { region });

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ region }),
  });

  console.log(`[🟡 응답 상태] ${res.status}`);

  const raw = await res.text();
  console.log(`[🟡 응답 원문]`, raw);

  if (!res.ok) {
    throw new Error(`지역 업데이트 실패 (status: ${res.status})`);
  }

  try {
    const data = JSON.parse(raw);
    console.log(`[✅ 업데이트 응답]`, data);
    return data;
  } catch (err) {
    console.error("[❌ JSON 파싱 실패]", err);
    throw new Error("응답 파싱 실패");
  }
}
