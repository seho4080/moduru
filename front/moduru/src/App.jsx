// src/App.jsx
import React from "react";
import Router from "./router/Router";
import TripCreateFormHost from "./features/tripCreate/ui/TripCreateFormHost";
import ReviewWriteHost from "./features/reviewWrite/ReviewWriteHost"; // ✅ 전역 리뷰 모달 호스트
import { AuthProvider } from "./shared/model/useAuth";

function App() {
  return (
    <AuthProvider> {/* 전역 인증 컨텍스트 */}
      <Router />

      {/* 전역 싱글톤 포털들 — 뒤에 렌더할수록 위에 뜸 */}
      <TripCreateFormHost />
      <ReviewWriteHost />  {/* ✅ 이제 어디서든 openReviewWrite/setReviewWriteTarget로 열림 */}
    </AuthProvider>
  );
}

export default App;