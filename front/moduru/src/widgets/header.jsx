import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../shared/model/useAuth";
import logoImage from "../assets/images/moduru-logo.png";
import loginIcon from "../assets/icons/login-icon.png";

const Header = ({ onLoginClick }) => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const handleProfileClick = () => {
    if (!isLoggedIn) {
      onLoginClick();
    } else {
      navigate("/my-page");
    }
  };

  return (
    <header className="w-[90%] flex justify-between items-center p-5 relative">
      <div
        className="w-[100px] h-auto cursor-pointer"
        onClick={() => navigate("/")}
      >
        <img src={logoImage} alt="로고" className="w-full h-auto" />
      </div>
      <div
        className="w-[70px] h-[70px] mt-5 mr-5 cursor-pointer"
        onClick={handleProfileClick}
      >
        <img src={loginIcon} alt="로그인 아이콘" className="w-full h-full" />
      </div>
    </header>
  );
};

export default Header;
