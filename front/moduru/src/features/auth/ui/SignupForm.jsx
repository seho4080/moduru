// features/auth/ui/SignupForm.jsx
import React, { useState } from 'react';
import './signupForm.css';

export default function SignupForm({ onClose, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    gender: '',
    birthYear: '',
    birthMonth: '',
    birthDay: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('[회원가입 정보]', formData);
  };

  return (
    <div className="signup-overlay">
      <div className="signup-modal">
        <div className="signup-header">
          <h2 className="signup-title">회원가입</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="form-row email-row">
            <input
              type="email"
              name="email"
              placeholder="이메일"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <button type="button" className="verify-btn">인증</button>
          </div>

          <input
            type="password"
            name="password"
            placeholder="비밀번호"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="비밀번호 확인"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          <label htmlFor="nickname" className="input-label">닉네임</label>
          <input
            id="nickname"
            type="text"
            name="nickname"
            placeholder="최대 8글자 입력"
            maxLength={8}
            value={formData.nickname}
            onChange={handleChange}
          />

          <label className="input-label">성별(선택)</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="dropdown-item"
          >
            <option value="">선택</option>
            <option value="male">남성</option>
            <option value="female">여성</option>
            <option value="other">기타</option>
          </select>

          <label className="input-label">생년월일(선택)</label>
          <div className="birth-selects">
            <select name="birthYear" value={formData.birthYear} onChange={handleChange}>
              <option value="">년</option>
              {[...Array(100)].map((_, i) => {
                const year = new Date().getFullYear() - i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
            <select name="birthMonth" value={formData.birthMonth} onChange={handleChange}>
              <option value="">월</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select name="birthDay" value={formData.birthDay} onChange={handleChange}>
              <option value="">일</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="submit-btn">가입하기</button>

          <div className="switch-to-login">
            이미 계정이 있으신가요?{' '}
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                onClose();          
                onSwitchToLogin(); 
              }}
            >
              로그인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
