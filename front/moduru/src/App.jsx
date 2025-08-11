// src/App.jsx
import React from "react";
import Router from "./router/Router";
import TripCreateFormHost from "./features/tripCreate/ui/TripCreateFormHost";

function App() {
  return (
    <>
      <Router />
      {/* TripCreateForm 전역 싱글톤 포털 */}
      <TripCreateFormHost />
    </>
  );
}

export default App;
