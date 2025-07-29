import React from 'react';
import TripRoomPage from './pages/tripRoomPage/TripRoomPage'; // 경로는 실제 위치에 맞게 수정!

function App() {
  return (
    <div className="App">
      <TripRoomPage />
    </div>
  );
}

export default App;

// src/App.js
// import React, { useState } from 'react';
// import LoginForm from './features/auth/ui/LoginForm';

// function App() {
//   const [showLogin, setShowLogin] = useState(false);

//   return (
//     <div className="app-container">
//       <header className="app-header">
//         <button className="login-open-button" onClick={() => setShowLogin(true)}>
//           로그인
//         </button>
//       </header>

//       {/* 로그인 모달 */}
//       {showLogin && <LoginForm onClose={() => setShowLogin(false)} />}
//     </div>
//   );
// }

// export default App;
