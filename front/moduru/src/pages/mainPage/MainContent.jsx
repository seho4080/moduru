import React from 'react';
import './MainPage.css';

const MainContent = () => {
  return (
    <div className="main-content">
      <div className="text-box">
        <h2>실시간으로 소통하며</h2>
        <h2>함께 만드는 여행 플랜</h2>
      </div>

      <button className="btn-start">여행 시작하기</button>

      <img src="/assets/images/moduru-mainpage-image.png" alt="메인 이미지" className="main-image" />

      <button className="btn-list">내 여행방 목록</button>
    </div>
  );
};

export default MainContent;
