import { logout } from '../../features/auth/lib/authApi';

export default function UserMenu({ onMyPage }) {
  const handleLogout = async () => {
    const { success } = await logout();
    if (success) {
      // NOTE: 로그아웃 성공 시 홈으로 이동 (팝업 없음)
      window.location.href = '/';
    }
  };

  return (
    <div className="user-menu">
      <button onClick={onMyPage}>마이페이지</button>
      <button onClick={handleLogout}>로그아웃</button>
    </div>
  );
}

