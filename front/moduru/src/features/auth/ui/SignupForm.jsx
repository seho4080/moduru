// src/features/auth/ui/SignupForm.jsx
import React, { useState, useMemo } from 'react';
import './signupForm.css';
import { signup, sendEmailCode, verifyEmailCode } from '../lib/authApi';

function validatePassword(pw) {
  const minLength = pw.length >= 8;
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pw);
  return { minLength, hasSpecial, valid: minLength && hasSpecial };
}

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

  const [code, setCode] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(''); // ❗오류만 노출 (성공문구 미표시)

  const pwCheck = useMemo(() => validatePassword(formData.password), [formData.password]);
  const isSubmitDisabled =
    submitting ||
    !formData.email ||
    !formData.password ||
    !formData.confirmPassword ||
    !pwCheck.valid ||
    formData.password !== formData.confirmPassword ||
    !emailVerified; // 이메일 인증을 필수로 유지

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 1) 인증 메일 전송 (성공문구 미표시)
  const handleSendCode = async () => {
    if (!formData.email) {
      setErrorMsg('이메일을 입력해 주세요.');
      return;
    }
    setSending(true);
    setErrorMsg('');
    try {
      const res = await sendEmailCode(formData.email);
      if (res?.success) {
        setEmailSent(true);
      } else {
        setErrorMsg(res?.message || '인증 코드 전송에 실패했습니다.');
      }
    } catch (e) {
      setErrorMsg(e?.message || '인증 코드 전송 중 오류가 발생했습니다.');
    } finally {
      setSending(false);
    }
  };

  // 2) 인증 코드 검증 (성공문구 미표시)
  const handleVerifyCode = async () => {
    if (!code) {
      setErrorMsg('인증 코드를 입력해 주세요.');
      return;
    }
    setVerifying(true);
    setErrorMsg('');
    try {
      const res = await verifyEmailCode(formData.email, code);
      if (res?.success) {
        setEmailVerified(true);
      } else {
        setErrorMsg(res?.message || '인증 코드를 확인할 수 없습니다.');
      }
    } catch (e) {
      setErrorMsg(e?.message || '인증 코드 확인 중 오류가 발생했습니다.');
    } finally {
      setVerifying(false);
    }
  };

  // 3) 가입하기 (성공 시 즉시 닫고 로그인 화면 전환)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!pwCheck.valid) {
      setErrorMsg('비밀번호는 8자 이상 & 특수문자를 포함해야 합니다.');
      return;
    }
    if (!emailVerified) {
      setErrorMsg('이메일 인증을 완료해 주세요.');
      return;
    }

    const genderMap = { male: 'M', female: 'F', other: 'N', '': 'N' };
    const birth =
      formData.birthYear && formData.birthMonth && formData.birthDay
        ? `${formData.birthYear}-${String(formData.birthMonth).padStart(2, '0')}-${String(formData.birthDay).padStart(2, '0')}`
        : undefined;

    const payload = {
      email: formData.email,
      password: formData.password,
      provider: 'LOCAL',
      nickname: formData.nickname || undefined,
      gender: genderMap[formData.gender] ?? 'N',
      birth,
      phone: undefined,
    };

    setSubmitting(true);
    try {
      const result = await signup(payload);
      if (result?.success) {
        onClose?.();
        onSwitchToLogin?.(); // 로그인 폼으로 전환
      } else {
        setErrorMsg(result?.message || '회원가입에 실패했습니다.');
      }
    } catch (e2) {
      setErrorMsg(e2?.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="signup-overlay">
      <div className="signup-modal">
        <div className="signup-header">
          <h2 className="signup-title">회원가입</h2>
          <button className="close-btn" onClick={onClose} aria-label="닫기">✕</button>
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
              disabled={emailVerified}
              autoComplete="email"
            />
            <button
              type="button"
              className="verify-btn"
              onClick={handleSendCode}
              disabled={sending || !formData.email || emailVerified}
              aria-busy={sending}
            >
              {emailVerified ? '인증완료' : (sending ? '전송중' : '인증')}
            </button>
          </div>

          {/* 코드 입력은 전송 후에만 노출, 성공 문구는 없음 */}
          {emailSent && !emailVerified && (
            <div className="form-row email-row">
              <input
                type="text"
                name="code"
                placeholder="이메일로 받은 인증 코드"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="one-time-code"
              />
              <button
                type="button"
                className="verify-btn"
                onClick={handleVerifyCode}
                disabled={verifying || !code}
                aria-busy={verifying}
              >
                {verifying ? '확인중' : '코드확인'}
              </button>
            </div>
          )}

          <input
            type="password"
            name="password"
            placeholder="비밀번호"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />

          {/* 비밀번호 규칙 체크박스 */}
          <div className="pw-checklist">
            <label className="pw-check">
              <input type="checkbox" checked={pwCheck.hasSpecial} readOnly />
              <span>특수문자 포함</span>
            </label>
            <label className="pw-check">
              <input type="checkbox" checked={pwCheck.minLength} readOnly />
              <span>8자 이상</span>
            </label>
          </div>

          <input
            type="password"
            name="confirmPassword"
            placeholder="비밀번호 확인"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            autoComplete="new-password"
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

          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitDisabled}
            aria-busy={submitting}
          >
            {submitting ? '처리중...' : '가입하기'}
          </button>

          {/* 오류만 표시 */}
          {errorMsg && <div className="form-error" role="alert">{errorMsg}</div>}

          <div className="switch-to-login">
            이미 계정이 있으신가요?{' '}
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                onClose?.();
                onSwitchToLogin?.();
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
