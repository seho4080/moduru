// builtin
import React from "react";
import ReactDOM from "react-dom/client";

// external
import { Provider } from "react-redux";

// internal
import store from "./redux/store";
import { AuthProvider } from "./shared/model/useAuth";

// relative
import App from "./App";

// styles
import "./index.css";

/**
 * Polyfill 설정
 * STOMP, SockJS 등 global 객체 사용 대응
 */
import { Buffer } from "buffer";
import process from "process";

window.Buffer = Buffer;
window.process = process;

// Root 렌더링
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Provider>
  </React.StrictMode>
);
