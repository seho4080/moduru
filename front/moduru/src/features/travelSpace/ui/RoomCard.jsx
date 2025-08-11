import React from "react";
import { useNavigate } from "react-router-dom";

const RoomCard = ({ room }) => {
  const navigate = useNavigate();

  const handleEnterRoom = () => {
    navigate(`/trip-room/${room.travelRoomId}`, { state: room });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md w-[280px]">
      <h3 className="text-xl font-bold mb-2">{room.title || "제목 없음"}</h3>
      <p className="text-sm text-gray-600 mb-1">{room.region || "지역 미정"}</p>
      <p className="text-sm text-gray-600">
        {room.startDate} ~ {room.endDate}
      </p>
      <button
        onClick={handleEnterRoom}
        className="mt-4 w-full bg-blue-500 text-white py-1 rounded hover:bg-blue-600 transition"
      >
        입장하기
      </button>
    </div>
  );
};

export default RoomCard;
