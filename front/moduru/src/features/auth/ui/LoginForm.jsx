import React, { useState } from 'react';
import { login } from '../lib/authApi';
import { useAuth } from '../../../shared/model/useAuth';
import './loginForm.css';

export default function LoginForm({ onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setIsLoggedIn } = useAuth();

  // NOTE: 로그인 요청 결과에 따라 인증 상태를 업데이트하고, UI 전환을 처리함
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login({ email, password });

    if (result.success) {
      setIsLoggedIn(true);
      setLoading(false);
      onClose();
      onSuccess?.();
      return;
    }

    // NOTE: 로그인 실패 시 사용자에게 메시지를 보여주기 위한 처리
    console.error('로그인 실패:', result.message);
    setLoading(false);
  };

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
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
