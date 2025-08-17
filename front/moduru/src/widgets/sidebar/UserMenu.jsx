// src/widgets/sidebar/UserMenu.jsx
import { useNavigate } from 'react-router-dom';
import { logout } from '../../features/auth/lib/authApi';

export default function UserMenu() {
  const navigate = useNavigate();

  const handleMyPage = () => {
    navigate('/my-page'); // 마이페이지로 이동
  };

  const handleLogout = async () => {
    const { success } = await logout();
    if (success) {
      // NOTE: 로그아웃 성공 시 홈으로 이동 (팝업 없음)
      window.location.href = '/';
    }
  };

  return (
    <div className="user-menu">
      <button onClick={handleMyPage}>마이페이지</button>
      <button onClick={handleLogout}>로그아웃</button>
    </div>
  );
}
