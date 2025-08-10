// src/shared/model/useAuth.js
import { useState, useEffect, createContext, useContext } from 'react';

const AuthContext = createContext();
function decodeJwtPayload(token) {
  if (!token) return null;
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '==='.slice((base64.length + 3) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}
export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    // 🔐 JWT 유효성 검사
    const isTokenValid = (token) => {
      try {
        const payload = JSON.parse(atob(token.split('.')[1])); // payload 추출
        const now = Math.floor(Date.now() / 1000);
        return payload.exp && payload.exp > now;
      } catch {
        return false;
      }
    };

    const accessValid = isTokenValid(accessToken);
    const refreshValid = isTokenValid(refreshToken);
    
    const valid = accessValid && refreshValid;
    console.log('[🟢 토큰 만료 검사 결과]', { accessValid, refreshValid });
    const p = decodeJwtPayload(accessToken);
    setUserId(p?.sub || p?.userId || p?.id || null); // 발급 claim에 맞춰 선택
    setIsLoggedIn(valid);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, userId, setIsLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
