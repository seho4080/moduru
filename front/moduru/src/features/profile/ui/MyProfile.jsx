// src/components/MyProfile.jsx
import React, { useState, useEffect } from "react";
import { getProfile, updateProfile } from "../lib/profileAPI";
import "./MyProfile.css";

export default function MyProfile() {
  const [profile, setProfile] = useState({
    id: 0,
    email: "",
    nickname: "",
    phone: "",
    profileImg: "",
    gender: "",
    birth: "",
    provider: "",
    role: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const data = await getProfile();
      setProfile(data);
      setEditForm(data);
    } catch (error) {
      console.error("프로필 조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm({ ...profile });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm(profile);
  };

  const handleSave = async () => {
    // Swagger 스펙: nickname, password, phone, profileImg 만 허용
    const payloadRaw = {
      nickname: editForm.nickname ?? "",
      phone: editForm.phone ?? "",
      profileImg: editForm.profileImg ?? ""
      // password는 별도 변경 UI 있을 때 추가
    };
    // 빈 문자열은 제외해서 불필요한 필드 전송 방지
    const payload = Object.entries(payloadRaw).reduce((acc, [k, v]) => {
      if (v !== "" && v != null) acc[k] = v;
      return acc;
    }, {});

    try {
      setIsSaving(true);
      const updated = await updateProfile(payload);
      console.log("[Profile][update] response:", updated);

      // 서버가 최신 프로필을 응답으로 돌려준다고 가정
      setProfile(updated);
      setEditForm(updated);
      setIsEditing(false);
      alert("프로필이 저장되었습니다.");
    } catch (error) {
      console.error("프로필 수정 실패:", error);
      alert(error?.message || "프로필 수정에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const getGenderText = (gender) => {
    switch (gender) {
      case "male":
        return "남성";
      case "female":
        return "여성";
      default:
        return "설정되지 않음";
    }
  };

  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <div className="loading-state">프로필을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-card">
      {/* 카드 헤더 */}
      <div className="profile-card-header">
        <h2>내 정보</h2>
        <p>개인정보를 안전하게 관리하세요</p>
      </div>

      {/* 프로필 이미지 */}
      <div className="profile-avatar-section">
        <div className="avatar-wrapper">
          {profile.profileImg ? (
            <img src={profile.profileImg} alt="프로필" className="avatar-image" />
          ) : (
            <div className="avatar-placeholder">
              <span>{profile.nickname?.charAt(0)?.toUpperCase() || "U"}</span>
            </div>
          )}
        </div>
        {isEditing && (
          <button
            className="avatar-edit-btn"
            title="프로필 이미지 변경(현재는 URL만 지원)"
            onClick={() => {
              const url = prompt("프로필 이미지 URL을 입력하세요", editForm.profileImg || "");
              if (url != null) handleInputChange("profileImg", url);
            }}
          >
            📷
          </button>
        )}
      </div>

      {/* 프로필 정보 */}
      <div className="profile-info-section">
        <div className="info-grid">
          {/* 이메일 */}
          <div className="info-item">
            <label className="info-label">이메일</label>
            <div className="info-value">
              <input type="email" value={profile.email} disabled className="info-input readonly" />
              <span className="readonly-note">변경 불가</span>
            </div>
          </div>

          {/* 닉네임 */}
          <div className="info-item">
            <label className="info-label">닉네임</label>
            <div className="info-value">
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.nickname || ""}
                  onChange={(e) => handleInputChange("nickname", e.target.value)}
                  className="info-input editable"
                  placeholder="닉네임을 입력하세요"
                />
              ) : (
                <input
                  type="text"
                  value={profile.nickname || "설정되지 않음"}
                  disabled
                  className="info-input readonly"
                />
              )}
            </div>
          </div>

          {/* 전화번호 */}
          <div className="info-item">
            <label className="info-label">전화번호</label>
            <div className="info-value">
              {isEditing ? (
                <input
                  type="tel"
                  value={editForm.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="info-input editable"
                  placeholder="전화번호를 입력하세요"
                />
              ) : (
                <input
                  type="text"
                  value={profile.phone || "설정되지 않음"}
                  disabled
                  className="info-input readonly"
                />
              )}
            </div>
          </div>

          {/* 성별 */}
          <div className="info-item">
            <label className="info-label">성별</label>
            <div className="info-value">
              {isEditing ? (
                <select
                  value={editForm.gender || ""}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  className="info-select editable"
                  disabled
                  title="서버 스펙상 수정 불가 필드"
                >
                  <option value="">선택하세요</option>
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                  <option value="other">기타</option>
                </select>
              ) : (
                <input type="text" value={getGenderText(profile.gender)} disabled className="info-input readonly" />
              )}
            </div>
          </div>

          {/* 생년월일 */}
          <div className="info-item">
            <label className="info-label">생년월일</label>
            <div className="info-value">
              {isEditing ? (
                <input
                  type="date"
                  value={editForm.birth || ""}
                  onChange={(e) => handleInputChange("birth", e.target.value)}
                  className="info-input editable"
                  disabled
                  title="서버 스펙상 수정 불가 필드"
                />
              ) : (
                <input type="text" value={profile.birth || "설정되지 않음"} disabled className="info-input readonly" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="profile-actions">
        {isEditing ? (
          <div className="action-buttons editing">
            <button className="btn btn-cancel" onClick={handleCancel} disabled={isSaving}>
              취소
            </button>
            <button className="btn btn-save" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "저장 중..." : "저장"}
            </button>
          </div>
        ) : (
          <div className="action-buttons">
            <button className="btn btn-edit" onClick={handleEdit}>
              정보 수정
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
