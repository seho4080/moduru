// src/pages/MyTravelSpacePage.jsx
import React, { useEffect, useState } from "react";
import Header from "../../widgets/header";
import Footer from "../../widgets/footer";
import SearchBar from "../../features/travelSpace/ui/SearchBar";
import RoomCard from "../../features/travelSpace/ui/RoomCard";
import { getUserTravelRooms } from "../../features/travelSpace/lib/roomApi";

const MyTravelSpacePage = () => {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await getUserTravelRooms();
        setRooms(res);
      } catch (err) {
        console.error("여행방 목록 불러오기 실패", err);
      }
    };

    fetchRooms();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#f5faff]">
      <Header />
      <main className="flex-1 flex flex-col items-center px-6 py-10">
        <h2 className="text-2xl font-bold mb-6">My travel space</h2>
        <div className="bg-gray-200 w-full max-w-5xl p-6 rounded-lg">
          <SearchBar />
          <div className="flex flex-wrap gap-6 mt-6">
            {rooms.map((room) => (
              <RoomCard key={room.travelRoomId} room={room} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyTravelSpacePage;
