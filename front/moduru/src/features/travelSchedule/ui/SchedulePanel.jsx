import React from "react";
import ScheduleEditor from "./ScheduleEditor";

export default function SchedulePanel() {
  // 더미 여행방 정보
  const travelRoomInfo = {
    startDate: "2025-07-01",
    endDate: "2025-07-04",
  };

  // 더미 일정 데이터
  const scheduleByDate = {
    "2025-07-01": [
      {
        title: "김희선의 짜글이",
        imgUrl: "https://placekitten.com/100/100",
        durationMin: 40,
      },
      {
        title: "카페 산책",
        imgUrl: "https://placekitten.com/120/120",
        durationMin: 25,
      },
    ],
    "2025-07-02": [
      {
        title: "박물관 투어",
        imgUrl: "https://placekitten.com/101/101",
        durationMin: 60,
      },
      {
        title: "야시장 구경",
        imgUrl: "https://placekitten.com/130/130",
        durationMin: 20,
      },
    ],
    "2025-07-03": [
      {
        title: "등산",
        imgUrl: "https://placekitten.com/110/110",
        durationMin: 90,
      },
      {
        title: "온천",
        imgUrl: "https://placekitten.com/140/140",
        durationMin: 45,
      },
    ],
    "2025-07-04": [
      {
        title: "기념품 쇼핑",
        imgUrl: "https://placekitten.com/111/111",
        durationMin: 30,
      },
    ],
  };

  return (
    <div style={{ width: "450px" }} className="bg-white">
      <ScheduleEditor
        startDate={travelRoomInfo.startDate}
        endDate={travelRoomInfo.endDate}
        scheduleByDate={scheduleByDate}
      />
    </div>
  );
}
