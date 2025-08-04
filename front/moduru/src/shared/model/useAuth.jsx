// src/shared/model/useAuth.js
import { useState, useEffect, createContext, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

    setIsLoggedIn(valid);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
