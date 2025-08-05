// src/features/travelSpace/ui/RoomCard.jsx
import React from "react";

/**
 * 여행방 카드
 * @param {{ room: { travelRoomId, title, region, startDate, endDate, members } }} props
 */
const RoomCard = ({ room }) => {
  return (
    <div className="w-64 h-44 border bg-white rounded-md shadow-md p-4 relative">
      {/* 삭제 아이콘 자리 */}
      <button className="absolute top-2 right-2 text-gray-400">🗑️</button>

      {/* 방 제목 */}
      <h3 className="text-lg font-semibold">{room.title}</h3>

      {/* 날짜 및 지역 */}
      <p className="text-sm text-gray-500 mt-1">
        {room.startDate} ~ {room.endDate}
      </p>
      <p className="text-sm text-gray-500">{room.region}</p>

      {/* 버튼 영역 */}
      <div className="flex justify-between mt-6">
        <button className="border px-3 py-1 rounded text-sm">들어가기</button>
        <button className="border px-3 py-1 rounded text-sm">장소 보기</button>
      </div>
    </div>
  );
};

export default RoomCard;
