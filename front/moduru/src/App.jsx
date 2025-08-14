import React from "react";
import Router from "./router/Router";
import TripCreateFormHost from "./features/tripCreate/ui/TripCreateFormHost";
import { AuthProvider } from "./shared/model/useAuth"; 

function App() {
  return (
    <AuthProvider> {/* 전역 인증 컨텍스트 */}
      <Router />
      {/* TripCreateForm 전역 싱글톤 포털 */}
      <TripCreateFormHost />
    </AuthProvider>
  );
}

export default App;