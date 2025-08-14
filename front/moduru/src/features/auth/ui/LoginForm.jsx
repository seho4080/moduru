// src/features/auth/ui/LoginForm.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login } from '../lib/authApi';
import { useAuth } from '../../../shared/model/useAuth';
import SignupForm from './SignupForm';
import './loginForm.css';

export default function LoginForm({ onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [error, setError] = useState('');

  // ✅ 최신 AuthContext API에 맞춤
  const { setAuthUser, revalidate } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  // ESC로 닫기
  useEffect(() => {
    const onEsc = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

  // 오버레이 클릭 닫기
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login({ email, password });

      if (result?.success) {
        // ⬇️ 프로젝트 정책에 맞게: 쿠키 기반이면 이 두 줄은 제거 가능
        // if (result.accessToken) localStorage.setItem('accessToken', result.accessToken);
        // if (result.refreshToken) localStorage.setItem('refreshToken', result.refreshToken);

        // 사용자 식별 세팅 (가능하면 응답에서, 없으면 revalidate)
        const uid =
          result.userId ??
          result.id ??
          result.user?.userId ??
          result.user?.id ??
          null;

        if (uid != null) {
          setAuthUser(uid);
        } else {
          await revalidate();
        }

        // ✅ 모달 닫고 이동 처리
        onClose?.();

        // 이동 우선순위: ?next > onSuccess() > /
        const params = new URLSearchParams(location.search);
        const next = params.get('next');

        if (next) {
          navigate(next, { replace: true });
          return;
        }

        if (onSuccess) {
          onSuccess(); // InvitePage가 여기서 보류 토큰 소비 + 합류 시도
          return;
        }

        navigate('/', { replace: true });
      } else {
        const msg =
          result?.message ??
          result?.error ??
          '로그인에 실패했습니다. 입력값을 확인하세요.';
        setError(msg);
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        '요청 처리 중 오류가 발생했습니다.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (showSignup) {
    return (
      <div className="login-overlay" onClick={handleOverlayClick}>
        <SignupForm onClose={() => setShowSignup(false)} />
      </div>
    );
  }

  return (
    <div className="login-overlay" onClick={handleOverlayClick}>
      <div className="login-modal" role="dialog" aria-modal="true">
        <button onClick={onClose} className="login-close" aria-label="닫기">&times;</button>
        <h2 className="login-title">로그인</h2>

        <form onSubmit={handleLogin} className="login-form">
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
            required
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            required
            autoComplete="current-password"
          />

          {error && <div className="login-error" role="alert">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="login-links">
          <button
            type="button"
            className="login-link-button"
            onClick={() => setShowSignup(true)}
          >
            회원가입
          </button>
          <button type="button" className="login-link-button">
            아이디/비밀번호 찾기
          </button>
        </div>

        <div className="social-divider">
          <hr className="divider-line" />
          <span className="divider-text">SNS LOGIN</span>
          <hr className="divider-line" />
        </div>
      </div>
    </div>
  );
}