// src/features/profile/profileAPI.js
import api from "../../../lib/axios";

// 사용자 정보 조회 (쿠키 인증)
export const getProfile = async () => {
  try {
    const res = await api.get('/users/me', {
      withCredentials: true,
      useToken: false, // 쿠키만 사용
    });
    return res.data;
  } catch (error) {
    const status = error?.response?.status;

    if (status === 401) throw new Error('인증되지 않은 사용자');
    if (status === 404) throw new Error('사용자를 찾을 수 없습니다');
    if (status === 500) throw new Error('서버 오류가 발생했습니다');

    throw new Error(error?.response?.data?.message || '회원정보 조회에 실패했습니다');
  }
};

// 사용자 정보 수정 (쿠키 인증)
export const updateProfile = async (profileData) => {
  /**
   * profileData 예시:
   * {
   *   nickname: "새 닉네임",
   *   password: "새 비밀번호",
   *   phone: "010-1234-5678",
   *   profileImg: "이미지URL"
   * }
   */
  try {
    const res = await api.put('/users/me', profileData, {
      withCredentials: true,
      useToken: false, // 쿠키만 사용
      headers: { 'Content-Type': 'application/json' },
    });
    return res.data;
  } catch (error) {
    const status = error?.response?.status;

    if (status === 400) throw new Error('잘못된 요청 형식');
    if (status === 401) throw new Error('인증되지 않은 사용자');
    if (status === 404) throw new Error('사용자를 찾을 수 없습니다');
    if (status === 500) throw new Error('서버 오류가 발생했습니다');

    throw new Error(error?.response?.data?.message || '회원정보 수정에 실패했습니다');
  }
};

// 프로필 이미지 업로드 (쿠키 인증, multipart/form-data)
export const uploadProfileImage = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('profileImage', imageFile);

    const res = await api.post('/users/me/profile-image', formData, {
      withCredentials: true,
      useToken: false, // 쿠키만 사용
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  } catch (error) {
    const status = error?.response?.status;

    if (status === 401) throw new Error('인증되지 않은 사용자');
    if (status === 404) throw new Error('사용자를 찾을 수 없습니다');
    if (status === 500) throw new Error('서버 오류가 발생했습니다');

    throw new Error(error?.response?.data?.message || '프로필 이미지 업로드에 실패했습니다');
  }
};
