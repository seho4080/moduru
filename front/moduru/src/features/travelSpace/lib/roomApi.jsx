// src/features/travelSpace/api/roomApi.js
import axios from "axios";

/**
 * 로그인한 유저의 여행방 목록을 조회
 */
export const getUserTravelRooms = async () => {
  const accessToken = localStorage.getItem("accessToken");

  const res = await axios.get("/api/users/travel-rooms", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return res.data.data;
};
