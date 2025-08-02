import React, { useState } from 'react';
import './index.css'; // Tailwind가 설정된 CSS

<<<<<<< HEAD
// function App() {
//   const [clicked, setClicked] = useState(false);

//   return (
//     <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center gap-6">
//       <h1 className={`text-4xl font-bold ${clicked ? 'text-green-500' : 'text-blue-600'} transition-all`}>
//         {clicked ? '클릭됨!' : 'Tailwind CSS 정상 작동!'}
//       </h1>

//       <button
//         className={`px-6 py-3 rounded-lg shadow-md font-semibold 
//           ${clicked ? 'bg-green-400 hover:bg-green-500' : 'bg-blue-400 hover:bg-blue-500'} 
//           text-white transition-colors duration-300`}
//         onClick={() => setClicked((prev) => !prev)}
//       >
//         {clicked ? '다시 확인하기' : '눌러보세요'}
//       </button>
//     </div>
//   );
// }

// import React from 'react'
// import TripRoomPage from './pages/tripRoomPage/TripRoomPage'

// export default function App() {
//   return (
//     <div className="App">
//       <TripRoomPage />
//       <div style={{ color: 'red', fontSize: '24px' }}>🔥 테스트 문구</div>
//     </div>
//   )
// }
export default function App() {
  return (
    <div style={{ padding: '40px', backgroundColor: '#ffe' }}>
      <h1 style={{ color: 'black' }}>🔥 렌더링 테스트 성공!</h1>
    </div>
  );
}
=======
function App() {
  const [clicked, setClicked] = useState(false);

  return (
    <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center gap-6">
      <h1 className={`text-4xl font-bold ${clicked ? 'text-green-500' : 'text-blue-600'} transition-all`}>
        {clicked ? '클릭됨!' : 'Tailwind CSS 정상 작동!'}
      </h1>

      <button
        className={`px-6 py-3 rounded-lg shadow-md font-semibold 
          ${clicked ? 'bg-green-400 hover:bg-green-500' : 'bg-blue-400 hover:bg-blue-500'} 
          text-white transition-colors duration-300`}
        onClick={() => setClicked((prev) => !prev)}
      >
        {clicked ? '다시 확인하기' : '눌러보세요'}
      </button>
    </div>
  );
}

export default App;
>>>>>>> 0fc13e4 ([BUILD] react-vite-프로젝트-생성)
