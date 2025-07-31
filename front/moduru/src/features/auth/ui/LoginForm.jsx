import React, { useState } from 'react';
import './LoginForm.css';

export default function LoginForm({ onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', 
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '로그인 실패');
      }

      // ✅ 응답 정상 처리
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);

      // 👉 나중에 전역 상태로 user 정보 저장 가능
      // 예: setUser(data.user);

      onClose(); // 모달 닫기

    } catch (err) {
      console.error(err);
      setError(err.message); // 에러 메시지 출력
    }
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
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="login-button">
            로그인
          </button>
        </form>

        <div className="login-links">
          <button>회원가입</button>
          <button>아이디/비밀번호 찾기</button>
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
