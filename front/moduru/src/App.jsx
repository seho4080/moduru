import React, { useState } from 'react';
import './index.css'; // Tailwind가 설정된 CSS

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