import React, { useState } from 'react';
import { login } from '../lib/authApi';
import { useAuth } from '../../../shared/model/useAuth';
import SignupForm from './SignupForm';
import './loginForm.css';

export default function LoginForm({ onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false); // 회원가입 모달 열기
  const { setIsLoggedIn } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login({ email, password });

    if (result.success) {
      localStorage.setItem('accessToken', result.accessToken);
      localStorage.setItem('refreshToken', result.refreshToken);
      setIsLoggedIn(true);
      setLoading(false);
      onClose();
      onSuccess?.();
    } else {
      console.warn('[Login Failed]', result.message);
      // NOTE: 에러 메시지 화면에 표시하지 않음
      setLoading(false);
    }
  };

  const handleOpenSignup = () => {
    setShowSignup(true);
  };

  const handleCloseSignup = () => {
    setShowSignup(false);
  };

  if (showSignup) {
    return <SignupForm onClose={handleCloseSignup} />;
  }

  return (
    <div className="login-overlay">
      <div className="login-modal">
        <button onClick={onClose} className="login-close">&times;</button>
        <h2 className="login-title">로그인</h2>

        <form onSubmit={handleLogin} className="login-form">
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
            required
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            required
          />

          {/* NOTE: 에러 메시지 제거했음 */}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="login-links">
          <button className="login-link-button" onClick={handleOpenSignup}>
            회원가입
          </button>
          <button className="login-link-button">아이디/비밀번호 찾기</button>
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
