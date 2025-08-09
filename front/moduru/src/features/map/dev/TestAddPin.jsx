// // external 파이팅..!
// import React, { useEffect, useState } from "react";
// import { useDispatch } from "react-redux";

// // internal
// import { addPin, removePin } from "../../../redux/slices/pinSlice";
// import {
//   connectWebSocket,
//   publishMessage,
// } from "/src/features/webSocket/socket";

// /**
//  * WebSocket add/remove 테스트용 버튼
//  * @param {object} props
//  * @param {string} props.roomId - 현재 여행방 ID
//  */
// const TestAddRemovePin = ({ roomId }) => {
//   const dispatch = useDispatch();
//   const [isConnected, setIsConnected] = useState(false);
//   const [lastWantId, setLastWantId] = useState(null); // 백에서 받은 wantId 저장

//   useEffect(() => {
//     if (!roomId) return;

//     connectWebSocket(roomId, [
//       {
//         handler: "place-want",
//         action: "add",
//         callback: (message) => {
//           console.log("서버에서 수신한 add 메시지:", message);
//           dispatch(addPin(message)); // 백에서 받은 message 객체를 그대로 핀으로 저장
//           setLastWantId(message.wantId); // 나중에 제거할 수 있도록 저장
//         },
//       },
//       {
//         handler: "place-want",
//         action: "remove",
//         callback: (message) => {
//           console.log("서버에서 수신한 remove 메시지:", message);
//           dispatch(removePin({ wantId: message.wantId }));
//         },
//       },
//     ]);

//     const interval = setInterval(() => {
//       if (window.stompClient?.connected) {
//         setIsConnected(true);
//         clearInterval(interval);
//       }
//     }, 500);

//     return () => clearInterval(interval);
//   }, [roomId]);

//   const handleAdd = () => {
//     if (!roomId || !isConnected) {
//       alert("WebSocket 연결 안 됨");
//       return;
//     }

//     const pinPayload = {
//       type: "place",
//       id: 3, // 원하는 고정 id
//       roomId,
//     };

//     publishMessage(roomId, "place-want", "add", pinPayload);
//   };

//   const handleRemove = () => {
//     if (!roomId || !isConnected || !lastWantId) {
//       alert("삭제할 wantId가 없습니다.");
//       return;
//     }

//     publishMessage(roomId, "place-want", "remove", {
//       roomId,
//       wantId: lastWantId,
//     });
//     setLastWantId(null);
//   };

//   return (
//     <div style={{ position: "absolute", top: 20, left: 20, zIndex: 1000 }}>
//       <button
//         onClick={handleAdd}
//         disabled={!isConnected}
//         style={{
//           marginBottom: "8px",
//           padding: "8px 12px",
//           backgroundColor: "#4caf50",
//           color: "white",
//           border: "none",
//           borderRadius: "6px",
//           marginRight: "8px",
//           cursor: isConnected ? "pointer" : "not-allowed",
//         }}
//       >
//         가짜 핀 추가
//       </button>
//       <button
//         onClick={handleRemove}
//         disabled={!isConnected || !lastWantId}
//         style={{
//           padding: "8px 12px",
//           backgroundColor: "#f44336",
//           color: "white",
//           border: "none",
//           borderRadius: "6px",
//           cursor: isConnected && lastWantId ? "pointer" : "not-allowed",
//         }}
//       >
//         가짜 핀 제거
//       </button>
//     </div>
//   );
// };

// export default TestAddRemovePin;
