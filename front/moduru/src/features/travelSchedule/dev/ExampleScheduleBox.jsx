// ExampleScheduleBox.jsx
import React, { useEffect, useState } from "react";
import {
  subscribeSchedule,
  publishSchedule,
  disconnectSchedule,
} from "../../webSocket/scheduleSocket";

export default function ExampleScheduleBox({ roomId }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeSchedule(roomId, (msg) => {
      setLogs((prev) => [msg, ...prev]);
    });
    return () => {
      unsubscribe();
      // disconnectSchedule(); // 여러 곳에서 공용이면 해제하지 말고 구독만 끊으세요.
    };
  }, [roomId]);

  const sendSample = () => {
    publishSchedule({
      roomId: 17,
      day: 1,
      date: "2025-07-02",
      events: [
        { wantId: 7, startTime: "09:00", endTime: "10:20", eventOrder: 1 },
        { wantId: 8, startTime: "11:00", endTime: "12:00", eventOrder: 2 },
      ],
    });
  };

  return (
    <div>
      <button onClick={sendSample}>일정 발행 (샘플)</button>
      <pre style={{ maxHeight: 200, overflow: "auto" }}>
        {JSON.stringify(logs, null, 2)}
      </pre>
    </div>
  );
}
