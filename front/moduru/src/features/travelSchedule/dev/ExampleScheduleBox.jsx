// src/features/travelSchedule/dev/ExampleTravelScheduleBox.jsx
import React, { useEffect, useMemo, useState } from "react";

// 1) travelSchedule 네이밍으로 변경했을 경우
import {
  subscribeTravelSchedule,
  publishTravelSchedule,
  disconnectTravelSchedule,
} from "../lib/travelScheduleSocket";

// 2) 만약 아직 schedule 네이밍을 쓰고 있다면 윗 import 대신 이 줄을 쓰고 함수명도 schedule 버전으로 바꿔서 테스트한다.
// import { subscribeSchedule, publishSchedule, disconnectSchedule } from "../../webSocket/scheduleSocket";

function ymd(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/**
 * 여행 일정 WS 자가진단 컴포넌트
 * - 연결/구독/수신/발행을 한 번에 점검한다.
 * - roomId, day, date를 입력해 실제 서버 라우팅과 DTO를 검증한다.
 */
export default function ExampleTravelScheduleBox({ roomId }) {
  const [logs, setLogs] = useState([]);
  const [connectedFlag, setConnectedFlag] = useState(false);
  const [day, setDay] = useState(1);
  const [date, setDate] = useState(ymd());
  const [useSample, setUseSample] = useState(true);

  // 현재 subscribe destination을 시각적으로 확인
  const destination = useMemo(() => {
    if (!roomId) return "-";
    // 서버 브로드캐스트 경로와 반드시 일치해야 한다.
    return `/topic/room/${roomId}/travel-schedule`;
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;

    // 구독 시작
    const unsubscribe = subscribeTravelSchedule(roomId, (msg) => {
      // 수신 로그
      setLogs((prev) => [
        { ts: Date.now(), dir: "IN", data: msg },
        ...prev.slice(0, 99),
      ]);
      // 수신이 왔다면 연결 플래그를 true로 본다(보조 지표)
      setConnectedFlag(true);
      // events가 배열이면 표 형태로도 확인 가능
      try {
        if (Array.isArray(msg?.events)) console.table(msg.events);
      } catch {}
    });

    // 언마운트 시 구독만 해제(공용 클라이언트라면 disconnect는 하지 않는다)
    return () => {
      try {
        unsubscribe();
      } catch {}
    };
  }, [roomId]);

  // 발행 버튼
  const sendSample = () => {
    if (!roomId) {
      alert("roomId가 필요합니다.");
      return;
    }
    if (!day || !date) {
      alert("day와 date는 필수입니다.");
      return;
    }

    // 샘플 events 또는 빈 events를 전송해 서버 DTO를 확인
    const events = useSample
      ? [
          { wantId: 7001, startTime: "09:00", endTime: "10:20", eventOrder: 0 },
          { wantId: 8002, startTime: "11:00", endTime: "12:00", eventOrder: 1 },
        ]
      : [];

    // 발행 로그
    setLogs((prev) => [
      { ts: Date.now(), dir: "OUT", data: { roomId, day, date, events } },
      ...prev.slice(0, 99),
    ]);

    publishTravelSchedule(
      { roomId, day: Number(day), date, events },
      { probe: true }
    );
  };

  // 강제 disconnect가 필요한 경우만 사용(공유 세션이면 주석 유지)
  const forceDisconnect = () => {
    disconnectTravelSchedule();
    setConnectedFlag(false);
    setLogs((prev) => [
      {
        ts: Date.now(),
        dir: "INFO",
        data: { message: "disconnectTravelSchedule() called" },
      },
      ...prev,
    ]);
  };

  return (
    <section style={panelStyle}>
      <header style={rowStyle}>
        <strong>TravelSchedule WS Probe</strong>
        <span style={{ fontFamily: "monospace" }}>dest: {destination}</span>
      </header>

      <div style={rowStyle}>
        <label style={labelStyle}>roomId</label>
        <input value={roomId ?? ""} readOnly style={inputStyle} />
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>day</label>
        <input
          type="number"
          min={1}
          value={day}
          onChange={(e) => setDay(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>sample events</label>
        <input
          type="checkbox"
          checked={useSample}
          onChange={(e) => setUseSample(e.target.checked)}
          title="체크하면 샘플 events, 해제하면 빈 events 전송"
        />
      </div>

      <div style={{ ...rowStyle, gap: 8 }}>
        <button onClick={sendSample}>publish</button>
        <button onClick={forceDisconnect}>disconnect</button>
      </div>

      <div style={{ marginTop: 8, fontSize: 12 }}>
        <div>connected(flag): {String(connectedFlag)}</div>
        <div>
          tip: DevTools → Network → WS → SockJS 프레임에서 SEND/MESSAGE 확인
        </div>
      </div>

      <pre style={logStyle}>
        {logs.map((l, i) => {
          const { ts, dir, data } = l;
          return `${new Date(ts).toISOString()} [${dir}] ${safeStringify(
            data
          )}\n`;
        })}
      </pre>
    </section>
  );
}

function safeStringify(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

const panelStyle = {
  position: "fixed",
  right: 12,
  bottom: 12,
  width: 520,
  maxHeight: "60vh",
  overflow: "auto",
  background: "#111",
  color: "#eaeaea",
  border: "1px solid #333",
  borderRadius: 8,
  padding: 12,
  fontFamily: "monospace",
  zIndex: 9999,
};

const rowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 8,
};
const labelStyle = { width: 100 };
const inputStyle = { flex: 1, fontFamily: "monospace" };
const logStyle = {
  marginTop: 8,
  whiteSpace: "pre-wrap",
  background: "#0b0b0b",
  padding: 8,
  borderRadius: 6,
};
