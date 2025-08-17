import React from "react";
import { useNavigate } from "react-router-dom";

const ActivityBox = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 w-full max-w-md">
      <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
        내 활동
      </h2>
      <div className="flex flex-col gap-4">
        <button
          className="bg-gray-100 hover:bg-gray-200 transition rounded-md py-3 px-4 text-gray-800 text-sm text-left font-medium shadow-sm"
          onClick={() => navigate("/my-page/my-travel-space")}
        >
          My Travel Space
        </button>
        <button
          className="bg-gray-100 hover:bg-gray-200 transition rounded-md py-3 px-4 text-gray-800 text-sm text-left font-medium shadow-sm"
          onClick={() => navigate("/my-page/my-places")}
        >
          My 장소 보기
        </button>
        <button
          className="bg-gray-100 hover:bg-gray-200 transition rounded-md py-3 px-4 text-gray-800 text-sm text-left font-medium shadow-sm"
          onClick={() => navigate("/my-page/my-reviews")}
        >
          내가 쓴 리뷰 보기
        </button>
      </div>
    </section>
  );
};

export default ActivityBox;
