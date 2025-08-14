// src/shared/model/useAuth.js
import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import api from '../../lib/axios';

const AuthContext = createContext({ isLoggedIn: false, userId: null, loading: true });

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // NOTE: 중복 실행 가드
  const hasFetchedOnce = useRef(false);

  // NOTE: 실제 서버 호출 함수
  const _fetchMe = useCallback(async () => {
    try {
      const res = await api.get('/users/me', { withCredentials: true });
      const data = res?.data ?? {};
      const uid =
        data.userId ??
        data.id ??
        data.user?.userId ??
        data.user?.id ??
        null;

      console.log('[Auth][me] success:', { uid, raw: data });
      setUserId(uid ?? null);
      setIsLoggedIn(uid != null);
    } catch (e) {
      console.log('[Auth][me] failed:', e?.response?.status, e?.response?.data);
      setUserId(null);
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // NOTE: 초기 1회만 실행 (StrictMode/중복 마운트 대비)
  useEffect(() => {
    if (hasFetchedOnce.current) return;
    hasFetchedOnce.current = true;
    _fetchMe();
  }, [_fetchMe]);

  // NOTE: 외부에서 강제로 재검증할 때는 가드 무시하고 실행
  const revalidate = useCallback(async () => {
    setLoading(true);
    await _fetchMe();
  }, [_fetchMe]);

  // NOTE: 로그인 직후 uid를 직접 세팅하는 헬퍼
  const setAuthUser = useCallback((uid) => {
    setUserId(uid ?? null);
    setIsLoggedIn(!!uid);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, userId, loading, revalidate, setAuthUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
