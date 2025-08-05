import React from "react";

function Home() {
  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-red-600">
        모두루에 오신 걸 환영합니다!
      </h1>
      <p className="mt-4 text-lg text-gray-700">
        이곳은 Tailwind CSS가 적용된 메인 화면입니다.
      </p>
      <button className="mt-6 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow">
        시작하기
      </button>
    </div>
  );
}

export default Home;
