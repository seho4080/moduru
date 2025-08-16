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
    try {
      const updatedProfile = await updateProfile(editForm);
      setProfile(updatedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error("프로필 수정 실패:", error);
      alert("프로필 수정에 실패했습니다.");
    }
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="loading">프로필을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="header-content">
          <h1>내 정보</h1>
          <p>개인정보를 안전하게 관리하세요</p>
        </div>
      </div>

      <div className="profile-content">
        {/* 프로필 이미지 섹션 */}
        <div className="profile-image-section">
          <div className="profile-image-wrapper">
            <div className="profile-image">
              {profile.profileImg ? (
                <img src={profile.profileImg} alt="프로필" />
              ) : (
                <div className="default-avatar">
                  <span>{profile.nickname?.charAt(0) || "U"}</span>
                </div>
              )}
            </div>
            {isEditing && (
              <button className="image-edit-btn">
                <span>📷</span>
              </button>
            )}
          </div>
        </div>

        {/* 프로필 정보 폼 */}
        <div className="profile-form">
          <div className="form-row">
            <label>이메일</label>
            <div className="form-field">
              <input
                type="email"
                value={profile.email}
                disabled
                className="readonly"
              />
              <span className="field-note">변경할 수 없습니다</span>
            </div>
          </div>

          <div className="form-row">
            <label>닉네임</label>
            <div className="form-field">
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.nickname}
                  onChange={(e) => handleInputChange("nickname", e.target.value)}
                  placeholder="닉네임을 입력하세요"
                />
              ) : (
                <input
                  type="text"
                  value={profile.nickname}
                  disabled
                  className="readonly"
                />
              )}
            </div>
          </div>

          <div className="form-row">
            <label>전화번호</label>
            <div className="form-field">
              {isEditing ? (
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="전화번호를 입력하세요"
                />
              ) : (
                <input
                  type="tel"
                  value={profile.phone || "설정되지 않음"}
                  disabled
                  className="readonly"
                />
              )}
            </div>
          </div>

          <div className="form-row">
            <label>성별</label>
            <div className="form-field">
              {isEditing ? (
                <select
                  value={editForm.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                >
                  <option value="">선택하세요</option>
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                  <option value="other">기타</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={
                    profile.gender === "male" ? "남성" :
                    profile.gender === "female" ? "여성" :
                    profile.gender === "other" ? "기타" : "설정되지 않음"
                  }
                  disabled
                  className="readonly"
                />
              )}
            </div>
          </div>

          <div className="form-row">
            <label>생년월일</label>
            <div className="form-field">
              {isEditing ? (
                <input
                  type="date"
                  value={editForm.birth}
                  onChange={(e) => handleInputChange("birth", e.target.value)}
                />
              ) : (
                <input
                  type="text"
                  value={profile.birth || "설정되지 않음"}
                  disabled
                  className="readonly"
                />
              )}
            </div>
          </div>

          <div className="form-row">
            <label>가입 방법</label>
            <div className="form-field">
              <input
                type="text"
                value={profile.provider || "일반"}
                disabled
                className="readonly"
              />
              <span className="field-note">변경할 수 없습니다</span>
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="form-actions">
            {isEditing ? (
              <>
                <button className="btn-cancel" onClick={handleCancel}>
                  취소
                </button>
                <button className="btn-save" onClick={handleSave}>
                  저장
                </button>
              </>
            ) : (
              <button className="btn-edit" onClick={handleEdit}>
                정보 수정
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}