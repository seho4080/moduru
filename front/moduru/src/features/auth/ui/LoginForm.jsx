// src/features/auth/ui/LoginForm.js
import React, { useState } from 'react';
import './LoginForm.css';

export default function LoginForm({ onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    console.log('로그인 시도:', email, password);
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

          <button type="submit" className="login-button">
            로그인
          </button>
        </form>

        <div className="login-links">
          <button>회원가입</button>
          <button>아이디/비밀번호 찾기</button>
        </div>

        {/* SNS 로그인 구분선 */}
        <div className="social-divider">
          <hr className="divider-line" />
          <span className="divider-text">SNS LOGIN</span>
          <hr className="divider-line" />
        </div>
      </div>
    </div>
  );
}
